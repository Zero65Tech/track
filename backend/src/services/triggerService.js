import assert from "assert";

import {
  CoinLedgerRef,
  CoinLedgerType,
  TriggerState,
  TriggerType,
} from "@shared/enums";
import { calculateAggregationCoins } from "../config/coin.js";
import transaction from "../utils/transaction.js";

import { _setAggregationResult } from "./aggregationService.js";
import {
  _deductCoinsFromLedger,
  _getCoinLedgerBalance,
  _initialiseCoinLedger,
} from "./coinService.js";
import { _aggregateEntries } from "./entryService.js";

import TriggerModel from "../models/Trigger.js";

async function getTriggers(profileId, lastCreatedAt, pageSize) {
  let query = {
    profileId: profileId,
    state: { $ne: TriggerState.COMPLETED.id },
  };

  const allButCompletedDataArr = lastCreatedAt
    ? []
    : await TriggerModel.find(query).sort({ createdAt: -1 }).lean();

  query.state = TriggerState.COMPLETED.id;
  if (lastCreatedAt) {
    query.createdAt = { $lt: lastCreatedAt };
  }

  const completedDataArr = await TriggerModel.find(query)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .lean();

  const dataArr = [...allButCompletedDataArr, ...completedDataArr];
  dataArr.forEach((data) => delete data["profileId"]);

  return dataArr;
}

async function _createProfileCreatedTrigger({ profileId }, session) {
  await TriggerModel.create(
    [
      {
        userId: process.env.SYSTEM_USER_ID,
        profileId,
        type: TriggerType.PROFILE_CREATED.id,
        state: TriggerState.QUEUED.id,
      },
    ],
    { session },
  );
}

async function createDataAggregationTrigger(
  userId,
  profileId,
  aggregationName,
  aggregationParams,
) {
  let data = await TriggerModel.findOne({
    profileId,
    type: TriggerType.DATA_AGGREGATION.id,
    aggregationName,
    aggregationParams,
    state: { $in: [TriggerState.QUEUED.id, TriggerState.RUNNING.id] },
  }).lean();

  if (!data) {
    const doc = await TriggerModel.create({
      userId,
      profileId,
      type: TriggerType.DATA_AGGREGATION.id,
      aggregationName,
      aggregationParams,
      state: TriggerState.QUEUED.id,
    });
    data = doc.toObject();
  }

  delete data.profileId;

  return data;
}

async function processTriggers(onTriggerStateChanged, instanceId, limit) {
  // Concurrent execution safety: This function may be invoked repeatedly (e.g., via cron) while
  // a previous invocation is still processing triggers. Overlapping invocations may fetch the same
  // trigger. The updateOne() query below uses optimistic concurrency control (OCC) on state
  // to prevent duplicate processing: the first invocation succeeds and transitions the trigger to
  // RUNNING state, causing subsequent attempts to fail the OCC check (modifiedCount === 0) and skip.
  //
  // Optimization: Once a concurrent instance claims the first trigger for a profile, skip all
  // remaining triggers from that profile in this batch. This reduces contention on the same
  // profile's triggers and allows other instances to process triggers from different profiles.

  const timestamp = Date.now();

  const triggerDataArr = await TriggerModel.find({
    state: { $in: [TriggerState.QUEUED.id, TriggerState.RUNNING.id] },
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  if (triggerDataArr.length === 0) return 0;

  let processedCount = 0;
  const skippedProfileIds = new Set(); // Track profiles where we failed to claim a trigger
  for (const triggerData of triggerDataArr) {
    const profileIdStr = triggerData.profileId.toString();

    if (skippedProfileIds.has(profileIdStr)) {
      // If we already failed to claim a trigger for this profile, skip all other triggers from it
      continue;
    }

    if (triggerData.state === TriggerState.RUNNING.id) {
      // If this trigger is already running, skip all other triggers from this profile
      skippedProfileIds.add(profileIdStr);
      continue;
    }

    const result = await TriggerModel.updateOne(
      { _id: triggerData._id, state: TriggerState.QUEUED.id },
      { $set: { state: TriggerState.RUNNING.id } },
    );

    if (result.modifiedCount === 0) {
      // Another instance claimed this trigger. Skip all other triggers from this profile.
      skippedProfileIds.add(profileIdStr);
      continue;
    }

    console.log(`[${instanceId}] ⏰ Processing trigger ${triggerData._id}`);

    const profileId = triggerData.profileId;
    delete triggerData.profileId;
    await _processTrigger(profileId, triggerData, onTriggerStateChanged);

    processedCount++;
  }

  console.log(
    `[${instanceId}] ⏰ Fetched ${triggerDataArr.length} and processed ${processedCount} trigger(s) in ${Date.now() - timestamp}ms`,
  );

  return processedCount;
}

async function _processTrigger(profileId, triggerData, onTriggerStateChanged) {
  await onTriggerStateChanged(profileId, { ...triggerData, state: TriggerState.RUNNING.id, updatedAt: new Date() }); // prettier-ignore

  if (triggerData.type === TriggerType.PROFILE_CREATED.id) {
    await _processProfileCreatedTrigger(profileId, triggerData);
  } else if (triggerData.type === TriggerType.PROFILE_OPENED.id) {
    // TODO: TriggerType.PROFILE_OPENED
  } else if (triggerData.type === TriggerType.DATA_AGGREGATION.id) {
    const balance = await _getCoinLedgerBalance(profileId);
    if (
      !["alpha", "beta"].includes(process.env.STAGE) &&
      profileId.toString() !== process.env.MASTER_PROFILE_ID &&
      balance.total < 1
    ) {
      const aggregationResult = "Insufficient Coins.";
      const updateResult = await TriggerModel.updateOne(
        { _id: triggerData._id, state: TriggerState.RUNNING.id },
        {
          $set: { state: TriggerState.FAILED.id, aggregationResult },
        },
      );

      assert.equal(updateResult.modifiedCount, 1); // 💪🏻

      await onTriggerStateChanged(profileId, { ...triggerData, state: TriggerState.FAILED.id, aggregationResult, updatedAt: new Date() }); // prettier-ignore

      return;
    }

    const triggerAggregationResult = await _processDataAggregationTrigger(
      profileId,
      triggerData,
    );

    await onTriggerStateChanged(profileId, { ...triggerData, state: TriggerState.COMPLETED.id, aggregationResult: triggerAggregationResult, updatedAt: new Date() }); // prettier-ignore
  } else if (triggerData.type === TriggerType.DATA_EXPORT.id) {
    // TODO: TriggerType.DATA_EXPORT
  } else {
    assert.fail(); // 💪🏻
  }
}

async function _processProfileCreatedTrigger(profileId, triggerData) {
  await transaction(async (session) => {
    await _initialiseCoinLedger(
      {
        profileId: profileId,
        ref: { type: CoinLedgerRef.TRIGGER.id, id: triggerData._id },
      },
      session,
    );

    const updateResult = await TriggerModel.updateOne(
      { _id: triggerData._id, state: TriggerState.RUNNING.id },
      { $set: { state: TriggerState.COMPLETED.id } },
    ).session(session);

    // If modifiedCount is not 1, throw error to rollback the entire transaction.
    assert.equal(updateResult.modifiedCount, 1);
  });
}

async function _processDataAggregationTrigger(profileId, triggerData) {
  const aggregationResult = await _aggregateEntries(
    profileId,
    triggerData.aggregationName,
    triggerData.aggregationParams,
  );

  const entriesProcessed = aggregationResult.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const coinsToDeduct = calculateAggregationCoins(entriesProcessed);

  const triggerAggregationResult = `Aggregated ${entriesProcessed} entries. ${coinsToDeduct} ${coinsToDeduct <= 1 ? "coin" : "coins"} consumed.`;

  await transaction(async (session) => {
    await _setAggregationResult(
      {
        profileId: profileId,
        aggregationName: triggerData.aggregationName,
        aggregationParams: triggerData.aggregationParams,
        aggregationResult: aggregationResult,
      },
      session,
    );

    await _deductCoinsFromLedger(
      {
        profileId: profileId,
        ref: { type: CoinLedgerRef.TRIGGER.id, id: triggerData._id },
        type: CoinLedgerType.DATA_AGGREGATION.id,
        coinsToDeduct,
      },
      session,
    );

    const updateResult = await TriggerModel.updateOne(
      {
        _id: triggerData._id,
        type: TriggerType.DATA_AGGREGATION.id, // without this Mongoose won't $set 'aggregationResult'
        state: TriggerState.RUNNING.id,
      },
      {
        $set: {
          state: TriggerState.COMPLETED.id,
          aggregationResult: triggerAggregationResult,
        },
      },
    ).session(session);

    // If modifiedCount is not 1, throw error to rollback the entire transaction.
    assert.equal(updateResult.modifiedCount, 1);
  });

  return triggerAggregationResult;
}

export { _createProfileCreatedTrigger };

export default { getTriggers, createDataAggregationTrigger, processTriggers };
