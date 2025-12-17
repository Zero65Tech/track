import { sendData } from "../utils/response.js";

import {
  getNamed as getNamedAggregation,
  createCustomPipeline as createAggregationPipeline,
  getCustomResult as getAggregationCustomResult,
} from "../services/aggregationService.js";

// Named

async function getNamedResult(req, res) {
  const data = await getNamedAggregation(req.params.profileId, req.params.name);
  sendData(res, { result: data.result, timestamp: data.updatedAt });
}

// Custom

async function createCustomPipeline(req, res) {
  const result = await createAggregationPipeline(
    req.params.profileId,
    req.body,
    req.user.uid,
  );
  sendData(res, { result });
}

async function getCustomResult(req, res) {
  const result = await getAggregationCustomResult(
    req.params.profileId,
    req.params.id,
  );
  sendData(res, { result });
}

export default { getNamedResult, createCustomPipeline, getCustomResult };
