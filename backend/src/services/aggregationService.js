import { AggregationName } from "@zero65/track";

import Aggregation from "../models/Aggregation.js";

// Named

async function getNamed(profileId, name) {
  return await Aggregation.findOne({ profileId, name }).lean();
}

async function _setNamedResult({ profileId, name, result }, session) {
  await Aggregation.updateOne(
    { profileId, name },
    { $set: { result } },
    { upsert: true },
  ).session(session);
}

// TODO: Custom Aggregation Implementation

async function createCustomPipeline(profileId, pipeline) {
  // TODO
  const doc = await Aggregation.create({ profileId, name: "custom", pipeline });
  return doc._id;
}

async function getCustomResult(profileId, id) {
  const doc = await Aggregation.findOne({
    profileId,
    name: AggregationName.CUSTOM.id,
    _id: id,
  }).select({ _id: 0, result: 1 });

  return doc ? doc.result : null;
}

async function _setCustomResult({ profileId, id, result }, session) {
  await Aggregation.updateOne(
    { profileId, name: "custom", _id: id },
    { $set: { result, timestamp: Date.now } },
    { upsert: true },
  ).session(session);
}

export default {
  getNamed,
  createCustomPipeline,
  getCustomResult,
  _setNamedResult,
  _setCustomResult,
};
