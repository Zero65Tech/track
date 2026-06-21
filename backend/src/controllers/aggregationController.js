import mongoose from "mongoose";

import { getAggregationResultSchema } from "@shared/schemas";
import { sendBadRequestError, sendData } from "../utils/response.js";

import aggregationService from "../services/aggregationService.js";

async function getAggregationResult(req, res) {
  const { success, error, data } = getAggregationResultSchema.safeParse(
    req.query,
  );

  if (!success) return sendBadRequestError(res, error);

  for (const key in data) {
    if (key === "entryType") {
      data["type"] = data["entryType"];
      delete data["entryType"];
    } else {
      data[key] = new mongoose.Types.ObjectId(data[key]);
    }
  }

  const aggregation = await aggregationService.getAggregation(
    new mongoose.Types.ObjectId(req.params.profileId),
    req.params.aggregationName,
    data,
  );

  sendData(res, {
    result: aggregation?.result || [],
    timestamp: aggregation?.updatedAt || null,
  });
}

export default { getAggregationResult };
