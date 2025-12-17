import { AggregationName } from "@zero65/track";

import AggregationModel from "../models/Aggregation.js";

// Named

async function getNamed(profileId, name) {
  return await AggregationModel.findOne({ profileId, name }).lean();
}

async function _setNamedAggregationResult(
  { profileId, name, result },
  session,
) {
  await AggregationModel.updateOne(
    { profileId, name },
    { $set: { result } },
    { upsert: true },
  ).session(session);
}

// TODO: Custom Aggregation Implementation

async function createCustomPipeline(profileId, pipeline) {
  // TODO
  const doc = await AggregationModel.create({
    profileId,
    name: "custom",
    pipeline,
  });
  return doc._id;
}

async function getCustomResult(profileId, id) {
  const doc = await AggregationModel.findOne({
    profileId,
    name: AggregationName.CUSTOM.id,
    _id: id,
  }).select({ _id: 0, result: 1 });

  return doc ? doc.result : null;
}

async function _setCustomAggregationResult({ profileId, id, result }, session) {
  await AggregationModel.updateOne(
    { profileId, name: "custom", _id: id },
    { $set: { result, timestamp: Date.now } },
    { upsert: true },
  ).session(session);
}

export {
  getNamed,
  createCustomPipeline,
  getCustomResult,
  _setNamedAggregationResult,
  _setCustomAggregationResult,
};
