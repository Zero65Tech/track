import assert from "assert";

import {
  TriggerType,
  TriggerState,
  CoinLedgerRef,
  CoinLedgerType,
} from "@zero65/track";

import { calculateAggregationCoins } from "../config/coin.js";

import transaction from "../utils/transaction.js";

import TriggerModel from "../models/Trigger.js";

import { _getCachedProfile, _updateProfile } from "./profileService.js";
import { aggregateByPipeline } from "./entryService.js";
import { _setNamedAggregationResult } from "./aggregationService.js";
import { _deductCoin } from "./coinLedger.js";
import { _sendFcmNotification } from "./userService.js";

async function _createTrigger({ profileId, data, userId }, session) {
  data["profileId"] = profileId;
  data["state"] = TriggerState.QUEUED.id;
  data["userId"] = userId;
  await TriggerModel.create([data], { session });
}

async function create(profileId, data, userId) {
  data["profileId"] = profileId;
  data["state"] = TriggerState.QUEUED.id;
  data["userId"] = userId;
  const doc = await TriggerModel.create(data);
  return doc.toObject();
}

async function processAll(limit = 1000) {
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
    // TODO: TriggerType.PROFILE_CREATED
  } else if (triggerData.type === TriggerType.PROFILE_OPENED.id) {
    // TODO: TriggerType.PROFILE_OPENED
  } else if (triggerData.type === TriggerType.DATA_AGGREGATION.id) {
    const profile = await _getCachedProfile(triggerData.profileId);

    if (profile.coins < 1) {
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
      return;
    }

    if (triggerData.params.name === "custom") {
      // TODO: TriggerType.DATA_AGGREGATION, custom
    } else {
      await _processNamedAggregation(triggerData, profile);
    }
  } else if (triggerData.type === TriggerType.DATA_EXPORT.id) {
    // TODO: TriggerType.DATA_EXPORT
  } else {
    assert.fail(); // 💪🏻
  }
}

async function _processNamedAggregation(triggerData, profile) {
  const { default: pipelineBuilder } = await import(
    `../config/aggregations/${triggerData.params.name}.js`
  );
  const aggregationPipeline = pipelineBuilder(triggerData.profileId);
  const aggregationResult = await aggregateByPipeline(
    triggerData.profileId,
    aggregationPipeline,
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
        name: triggerData.params.name,
        result: aggregationResult,
      },
      session,
    );

    const coinsRemaining = await _deductCoin(
      {
        profileId: triggerData.profileId,
        ref: { type: CoinLedgerRef.TRIGGER.id, id: triggerData._id },
        type: CoinLedgerType.DATA_AGGREGATION.id,
        countDeduct: coinsToDeduct,
      },
      session,
    );

    await _updateProfile(
      { id: triggerData._id, updates: { coins: coinsRemaining } },
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
            // TOOD: Move this to i18n
            message: `Aggregated ${entriesProcessed} Entries. ${coinsToDeduct} ${coinsToDeduct <= 1 ? "coin" : "coins"} consumed .`,
          },
        },
      },
    ).session(session);

    // If modifiedCount is 0, throw error to rollback the entire transaction.
    assert.notEqual(updateResult.modifiedCount, 0);
  });

  // Send FCM notification after successful completion
  await _sendFcmNotification([profile.owner, ...profile.editors], {
    triggerType: triggerData.type,
    triggerState: TriggerState.COMPLETED.id,
    profileId: triggerData.profileId.toString(),
    triggerId: triggerData._id.toString(),
    message: triggerData.result?.message || "Trigger completed successfully",
  });
}

export { create, _createTrigger, processAll };
