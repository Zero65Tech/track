import assert from "assert";

import {
  TriggerType,
  TriggerState,
  CoinLedgerRef,
  CoinLedgerType,
} from "@shared/enums";

import transaction from "../utils/transaction.js";
import TriggerModel from "../models/Trigger.js";
import { calculateAggregationCoins } from "../config/coin.js";

import { _sendFirebaseMessage } from "./userService.js";
import { _getCachedProfile } from "./profileService.js";
import { _aggregateEntries } from "./entryService.js";
import { _setNamedAggregationResult } from "./aggregationService.js";
import {
  _getCoinLedgerBalance,
  _initialiseCoinLedger,
  _deductCoinsFromLedger,
} from "./coinService.js";

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
) {
  let data = await TriggerModel.findOne({
    profileId,
    type: TriggerType.DATA_AGGREGATION.id,
    params: { aggregationName },
    state: { $in: [TriggerState.QUEUED.id, TriggerState.RUNNING.id] },
  }).lean();

  if (!data) {
    const doc = await TriggerModel.create({
      userId,
      profileId,
      type: TriggerType.DATA_AGGREGATION.id,
      params: { aggregationName },
      state: TriggerState.QUEUED.id,
    });
    data = doc.toObject();
  }

  data.id = data._id.toString();
  delete data["_id"];
  delete data["profileId"];
  return data;
}

async function _processTriggers(limit = 1000) {
  // Concurrent execution safety: This function may be invoked repeatedly (e.g., via cron) while
  // a previous invocation is still processing triggers. Overlapping invocations may fetch the same
  // trigger. The updateOne() query below uses optimistic concurrency control (OCC) on state
  // to prevent duplicate processing: the first invocation succeeds and transitions the trigger to
  // RUNNING state, causing subsequent attempts to fail the OCC check (modifiedCount === 0) and skip.

  const timestamp = Date.now();

  const triggerDataArr = await TriggerModel.find({
    state: TriggerState.QUEUED.id,
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  let processedCount = 0;
  for (const triggerData of triggerDataArr) {
    const result = await TriggerModel.updateOne(
      { _id: triggerData._id, state: TriggerState.QUEUED.id },
      { $set: { state: TriggerState.RUNNING.id } },
    );
    if (result.modifiedCount === 0) continue;
    await _processTrigger(triggerData);
    processedCount++;
  }
  console.log(
    `⏰ ${processedCount} trigger(s) processed in ${Date.now() - timestamp}ms`,
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
            result: { message: "Insufficient Coins." }, // TOOD: Move this to i18n
          },
        },
      );
      assert.notEqual(updateResult.modifiedCount, 0); // 💪🏻

      await _sendFirebaseMessage(
        [profile.owner, ...profile.editors],
        {},
        {
          profileId: triggerData.profileId.toString(),
          triggerId: triggerData._id.toString(),
          triggerType: triggerData.type,
          triggerState: TriggerState.FAILED.id,
          aggregationName: triggerData.params.aggregationName,
          message: "Insufficient Coins.",
        },
      );

      return;
    }

    if (triggerData.params.name === "custom") {
      // TODO: TriggerType.DATA_AGGREGATION, custom
    } else {
      await _processNamedDataAggregationTrigger(triggerData, profile);
    }

    await _sendFirebaseMessage(
      [profile.owner, ...profile.editors],
      {},
      {
        profileId: triggerData.profileId.toString(),
        triggerId: triggerData._id.toString(),
        triggerType: triggerData.type,
        triggerState: TriggerState.COMPLETED.id,
        aggregationName: triggerData.params.aggregationName,
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

    // If modifiedCount is 0, throw error to rollback the entire transaction.
    assert.notEqual(updateResult.modifiedCount, 0); // 💪🏻
  });
}

async function _processNamedDataAggregationTrigger(triggerData) {
  const aggregationResult = await _aggregateEntries(
    triggerData.profileId,
    triggerData.params.aggregationName,
  );

  const entriesProcessed = aggregationResult.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const coinsToDeduct = calculateAggregationCoins(entriesProcessed);

  await transaction(async (session) => {
    await _setNamedAggregationResult(
      {
        profileId: triggerData.profileId,
        aggregationName: triggerData.params.aggregationName,
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
        type: TriggerType.DATA_AGGREGATION.id, // without this Mongoose won't $set 'result'
        state: TriggerState.RUNNING.id,
      },
      {
        $set: {
          state: TriggerState.COMPLETED.id,
          result: {
            message: `Aggregated ${entriesProcessed} entries. ${coinsToDeduct} ${coinsToDeduct <= 1 ? "coin" : "coins"} consumed .`,
          },
        },
      },
    ).session(session);

    // If modifiedCount is 0, throw error to rollback the entire transaction.
    assert.notEqual(updateResult.modifiedCount, 0); // 💪🏻
  });
}

export { _createProfileCreatedTrigger, _processTriggers };

export default { createDataAggregationTrigger };
