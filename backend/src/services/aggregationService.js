import AggregationModel from "../models/Aggregation.js";

async function getNamedAggregation(
  profileId,
  aggregationName,
  aggregationParams,
) {
  const query = { profileId, name: aggregationName };

  if (Object.keys(aggregationParams).length === 0) {
    query.params = {};
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

async function _setAggregationResult(
  { profileId, aggregationName, aggregationParams, aggregationResult },
  session,
) {
  await AggregationModel.updateOne(
    { profileId, name: aggregationName, params: aggregationParams },
    { $set: { result: aggregationResult } },
    { upsert: true },
  ).session(session);
}

export { _setAggregationResult };

export default { getNamedAggregation };
