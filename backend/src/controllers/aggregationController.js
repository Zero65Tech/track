import { sendData } from "../utils/response.js";

import aggregationService from "../services/aggregationService.js";

// Named

async function getNamedResult(req, res) {
  const result = await aggregationService.getNamedResult(
    req.params.profileId,
    req.params.name,
  );
  sendData(res, { result });
}

// Custom

async function createCustomPipeline(req, res) {
  const result = await aggregationService.createCustomPipeline(
    req.params.profileId,
    req.body,
    req.user.uid,
  );
  sendData(res, { result });
}

async function getCustomResult(req, res) {
  const result = await aggregationService.getCustomResult(
    req.params.profileId,
    req.params.id,
  );
  sendData(res, { result });
}

export default { getNamedResult, createCustomPipeline, getCustomResult };
