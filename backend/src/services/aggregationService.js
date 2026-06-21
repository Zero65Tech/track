import AggregationModel from "../models/Aggregation.js";

async function getAggregation(profileId, aggregationName, aggregationParams) {
  const dataArr = await AggregationModel.findOne({
    profileId,
    name: aggregationName,
    params: aggregationParams,
  }).lean();

  dataArr.forEach((data) => delete data["profileId"]);

  return dataArr;
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
