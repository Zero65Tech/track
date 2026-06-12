import { sendData } from "../utils/response.js";
import aggregationService from "../services/aggregationService.js";

async function getAggregationResult(req, res) {
  const data = await aggregationService.getAggregation(
    req.params.profileId,
    req.params.name,
    req.query,
  );
  sendData(res, {
    result: data?.result || [],
    timestamp: data?.updatedAt || null,
  });
}

export default { getAggregationResult };
