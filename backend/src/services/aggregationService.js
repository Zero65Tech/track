import AggregationModel from "../models/Aggregation.js";

async function getAggregation(profileId, aggregationName, aggregationParams) {
  const data = await AggregationModel.findOne({
    profileId,
    name: aggregationName,
    params: aggregationParams,
  }).lean();

  delete data["profileId"];

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

export default { getAggregation };
