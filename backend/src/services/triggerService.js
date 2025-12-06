import _ from "lodash";
import { TriggerType, TriggerState } from "@zero65/track";

import transaction from "../utils/transaction.js";
import config from "../config/coin.js";
import getNamedAggregationPipeline from "../config/named-aggregation-pipelines.js";

import EntryModel from "../models/Entry.js";
import Trigger from "../models/Trigger.js";

import profileService from "./profileService.js";
import aggregationService from "./aggregationService.js";
import coinLedger from "./coinLedger.js";

async function create(profileId, type, params, userId) {
  const doc = await Trigger.create({
    userId,
    profileId,
    type,
    state: TriggerState.PENDING.id,
    params,
  });
  return doc.toObject();
}

async function _process(deadLine) {
  const summary = {};

  const docs = await Trigger.find({ state: TriggerState.PENDING.id })
    .sort({ createdAt: 1 })
    .limit(1000);

  for (let i = 0; i < docs.length - 1; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      if (!docs[i].profileId.equals(docs[j].profileId)) continue;
      if (docs[i].type !== docs[j].type) continue;
      if (!_.isEqual(docs[i].params, docs[j].params)) continue;
      docs[i].set("state", TriggerState.CANCELLED.id);
      docs[i].set("result", { message: "Duplicate Trigger." });
      await docs[i].save(); // OCC Kicks-In
      _.update(
        summary,
        [docs[i].type, TriggerState.CANCELLED.id],
        (val) => (val || 0) + 1,
      );
      break;
    }
  }

  while (Date.now() < deadLine) {
    const trigger = docs.find((doc) => doc.state == TriggerState.PENDING.id);
    if (!trigger) break;

    if (trigger.type === TriggerType.PROFILE_CREATED.id) {
      // TODO: TriggerType.PROFILE_CREATED
    } else if (trigger.type === TriggerType.PROFILE_OPENED.id) {
      // TODO: TriggerType.PROFILE_OPENED
    } else if (trigger.type === TriggerType.DATA_AGGREGATION.id) {
      const profile = profileService._getCached(trigger.profileId);

      if (profile.coins < 1) {
        trigger.set("state", TriggerState.CANCELLED.id);
        trigger.set("result", { message: "Insufficient Coins." });
        await trigger.save(); // OCC Kicks-In
        _.update(
          summary,
          [trigger.type, TriggerState.CANCELLED.id],
          (val) => (val || 0) + 1,
        );
      }

      if (trigger.params.name === "custom") {
        // TODO: TriggerType.DATA_AGGREGATION, custom
      } else {
        await _processNamedAggregation(trigger, summary);
      }
    } else if (trigger.type === TriggerType.DATA_EXPORT.id) {
      // TODO: TriggerType.DATA_EXPORT
    } else {
      throw new Error("Unexpected condition reached.");
    }
  }

  return summary;
}

async function _processNamedAggregation(trigger, summary) {
  await transaction(async (session) => {
    const aggregationPipeline = getNamedAggregationPipeline(
      trigger.profileId,
      trigger.params.name,
    );
    const result = await EntryModel.aggregate(aggregationPipeline);
    const entriesProcessed = result.reduce((sum, item) => sum + item.count, 0);
    const coinsToDeduct = config.aggregation(entriesProcessed);

    await aggregationService._setNamedResult(
      {
        profileId: trigger.profileId,
        name: trigger.params.name,
        result,
      },
      session,
    );

    const coinsRemaining = await coinLedger._deduct(
      {
        profileId: trigger.profileId,
        ref: { type: "trigger", id: trigger._id },
        type: "aggregation",
        countDeduct: coinsToDeduct,
      },
      session,
    );

    await profileService._update({ coins: coinsRemaining }, session);

    trigger.set("state", TriggerState.COMPLETED.id);
    trigger.set("result", {
      message: `Aggregated ${entriesProcessed} Entries. ${coinsToDeduct} ${coinsToDeduct <= 1 ? "coin" : "coins"} consumed .`,
    });
    await trigger.save({ session }); // OCC Kicks-In

    _.update(
      summary,
      [trigger.type, TriggerState.COMPLETED.id],
      (val) => (val || 0) + 1,
    );
    _.update(
      summary,
      [trigger.type, "entriesProcessed"],
      (val) => (val || 0) + entriesProcessed,
    );
    _.update(
      summary,
      [trigger.type, "coinsDeducted"],
      (val) => (val || 0) + coinsToDeduct,
    );
  });
}

export default { create, _process };
