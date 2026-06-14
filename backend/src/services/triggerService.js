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
import { _getCachedProfile } from "./profileService.js";
import { _sendFirebaseMessage } from "./userService.js";
import { _notifyTriggerUpdate } from "./notificationService.js";

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

  return [...allButCompletedDataArr, ...completedDataArr];
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

  return data;
}

async function _processTriggers(instanceId, limit = 1000) {
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

  if (triggerDataArr.length === 0) return;

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

    triggerData.state = TriggerState.RUNNING.id;
    triggerData.updatedAt = new Date();
    await _notifyTriggerUpdate(triggerData);

    console.log(`[${instanceId}] ⏰ Processing trigger ${triggerData._id}`);
    await _processTrigger(triggerData);
    processedCount++;
  }

  console.log(
    `[${instanceId}] ⏰ Fetched ${triggerDataArr.length} and processed ${processedCount} trigger(s) in ${Date.now() - timestamp}ms`,
  );
}

async function _processTrigger(triggerData) {
  if (triggerData.type === TriggerType.PROFILE_CREATED.id) {
    await _processProfileCreatedTrigger(triggerData);
  } else if (triggerData.type === TriggerType.PROFILE_OPENED.id) {
    // TODO: TriggerType.PROFILE_OPENED
  } else if (triggerData.type === TriggerType.DATA_AGGREGATION.id) {
    const profile = await _getCachedProfile(triggerData.profileId);
    const balance = await _getCoinLedgerBalance(triggerData.profileId);
    if (
      !["alpha", "beta"].includes(process.env.STAGE) &&
      triggerData.profileId.toString() !== process.env.MASTER_PROFILE_ID &&
      balance.total < 1
    ) {
      const updateResult = await TriggerModel.updateOne(
        { _id: triggerData._id, state: TriggerState.RUNNING.id },
        {
          $set: {
            state: TriggerState.FAILED.id,
            aggregationResult: "Insufficient Coins.",
          },
        },
      );

      assert.equal(updateResult.modifiedCount, 1); // 💪🏻

      await _sendFirebaseMessage(
        [profile.owner, ...profile.editors],
        {},
        {
          profileId: triggerData.profileId.toString(),
          triggerId: triggerData._id.toString(),
          triggerType: triggerData.type,
          triggerState: TriggerState.FAILED.id,
          aggregationName: triggerData.aggregationName,
          aggregationParams: JSON.stringify(triggerData.aggregationParams),
          message: "Insufficient Coins.",
        },
      );

      return;
    }

    await _processDataAggregationTrigger(triggerData, profile);

    await _sendFirebaseMessage(
      [profile.owner, ...profile.editors],
      {},
      {
        profileId: triggerData.profileId.toString(),
        triggerId: triggerData._id.toString(),
        triggerType: triggerData.type,
        triggerState: TriggerState.COMPLETED.id,
        aggregationName: triggerData.aggregationName,
        aggregationParams: JSON.stringify(triggerData.aggregationParams),
      },
    );
  } else if (triggerData.type === TriggerType.DATA_EXPORT.id) {
    // TODO: TriggerType.DATA_EXPORT
  } else {
    assert.fail(); // 💪🏻
  }
}

async function _processProfileCreatedTrigger(triggerData) {
  await transaction(async (session) => {
    await _initialiseCoinLedger(
      {
        profileId: triggerData.profileId,
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

async function _processDataAggregationTrigger(triggerData) {
  const aggregationResult = await _aggregateEntries(
    triggerData.profileId,
    triggerData.aggregationName,
    triggerData.aggregationParams,
  );

  const entriesProcessed = aggregationResult.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const coinsToDeduct = calculateAggregationCoins(entriesProcessed);

  await transaction(async (session) => {
    await _setAggregationResult(
      {
        profileId: triggerData.profileId,
        aggregationName: triggerData.aggregationName,
        aggregationParams: triggerData.aggregationParams,
        aggregationResult: aggregationResult,
      },
      session,
    );

    await _deductCoinsFromLedger(
      {
        profileId: triggerData.profileId,
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
          aggregationResult: `Aggregated ${entriesProcessed} entries. ${coinsToDeduct} ${coinsToDeduct <= 1 ? "coin" : "coins"} consumed.`,
        },
      },
    ).session(session);

    // If modifiedCount is not 1, throw error to rollback the entire transaction.
    assert.equal(updateResult.modifiedCount, 1);
  });
}

export { _createProfileCreatedTrigger, _processTriggers };

export default { getTriggers, createDataAggregationTrigger };
