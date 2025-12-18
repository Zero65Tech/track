import { AggregationName } from "@zero65/track";

import AggregationModel from "../models/Aggregation.js";

// Named

async function getNamedAggregation(profileId, name) {
  const data = await AggregationModel.findOne({ profileId, name }).lean();

  data.id = data._id.toString();
  delete data["_id"];

  return data;
}

async function _setNamedAggregationResult(
  { profileId, aggregationName, result },
  session,
) {
  await AggregationModel.updateOne(
    { profileId, name: aggregationName },
    { $set: { result } },
    { upsert: true },
  ).session(session);
}

// Custom

async function createCustomAggregation(profileId, pipeline) {
  const doc = await AggregationModel.create({
    profileId,
    name: AggregationName.CUSTOM.id,
    pipeline,
  });

  const data = doc.toObject();
  data.id = doc._id.toString();
  delete data["_id"];

  return data;
}

async function getCustomAggregation(profileId, aggregationId) {
  const data = await AggregationModel.findOne({
    profileId,
    name: AggregationName.CUSTOM.id,
    _id: aggregationId,
  }).lean();

  data.id = data._id.toString();
  delete data["_id"];

  return data;
}

async function _setCustomAggregationResult(
  { profileId, aggregationId, result },
  session,
) {
  await AggregationModel.updateOne(
    { profileId, name: AggregationName.CUSTOM.id, _id: aggregationId },
    { $set: { result } },
    { upsert: true },
  ).session(session);
}

export {
  getNamedAggregation,
  _setNamedAggregationResult,
  createCustomAggregation,
  getCustomAggregation,
  _setCustomAggregationResult,
};
