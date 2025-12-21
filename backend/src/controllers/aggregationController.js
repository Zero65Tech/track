import { createCustomAggregationSchema } from "@shared/schemas";
import { sendData, sendBadRequestError } from "../utils/response.js";
import aggregationService from "../services/aggregationService.js";

// Named

async function getNamedAggregationResult(req, res) {
  const data = await aggregationService.getNamedAggregation(
    req.params.profileId,
    req.params.name,
  );
  sendData(res, data ? { result: data.result, timestamp: data.updatedAt } : {});
}

// Custom

async function getCustomAggregationResult(req, res) {
  const result = await aggregationService.getCustomAggregation(
    req.params.profileId,
    req.params.id,
  );
  sendData(res, { result });
}

async function createCustomAggregation(req, res) {
  const { success, error } = createCustomAggregationSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const result = await aggregationService.createCustomAggregation(
    req.params.profileId,
    req.body,
  );
  sendData(res, { result });
}

export default {
  getNamedAggregationResult,
  getCustomAggregationResult,
  createCustomAggregation,
};
