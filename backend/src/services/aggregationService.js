import { AggregationName } from "@shared/enums";

import AggregationModel from "../models/Aggregation.js";

// Named

async function getNamedAggregation(
  profileId,
  aggregationName,
  aggregationParams,
) {
  const query = { profileId, name: aggregationName };

  if (Object.keys(aggregationParams).length === 0) {
    query.params = null;
  } else {
    // Dot-notation is required because Mongoose only auto-casts field values
    // (e.g. string → ObjectId) when querying by individual path ("params.bookId"),
    // not when matching the whole subdocument ({ params: { bookId: "..." } }).
    for (const key in aggregationParams)
      query[`params.${key}`] = aggregationParams[key];
  }

  const data = await AggregationModel.findOne(query).lean();

  if (!data) {
    return null;
  }

  data.id = data._id.toString();
  delete data["_id"];
  return data;
}

async function _setNamedAggregationResult(
  { profileId, aggregationName, aggregationParams, aggregationResult },
  session,
) {
  await AggregationModel.updateOne(
    { profileId, name: aggregationName, params: aggregationParams },
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
