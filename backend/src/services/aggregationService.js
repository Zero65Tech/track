import { AggregationName } from "@shared/enums";

import AggregationModel from "../models/Aggregation.js";

// Named

async function getNamedAggregation(profileId, aggregationName) {
  const data = await AggregationModel.findOne({
    profileId,
    name: aggregationName,
  }).lean();

  data.id = data._id.toString();
  delete data["_id"];

  return data;
}

async function _setNamedAggregationResult(
  { profileId, aggregationName, aggregationResult },
  session,
) {
  await AggregationModel.updateOne(
    { profileId, name: aggregationName },
    { $set: { result: aggregationResult } },
    { upsert: true },
  ).session(session);
}

// Custom

async function createCustomAggregation(profileId, aggregationPipeline) {
  const doc = await AggregationModel.create({
    profileId,
    name: AggregationName.CUSTOM.id,
    pipeline: aggregationPipeline,
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
  { profileId, aggregationId, aggregationResult },
  session,
) {
  await AggregationModel.updateOne(
    { profileId, name: AggregationName.CUSTOM.id, _id: aggregationId },
    { $set: { result: aggregationResult } },
    { upsert: true },
  ).session(session);
}

export { _setNamedAggregationResult, _setCustomAggregationResult };

export default {
  getNamedAggregation,
  createCustomAggregation,
  getCustomAggregation,
};
