import { sendData } from "../utils/response.js";
import { createDataAggregationTrigger } from "../services/triggerService.js";

async function create(req, res) {
  const result = await createDataAggregationTrigger(
    req.user.uid,
    req.params.profileId,
    req.body.aggregationName,
  );
  sendData(res, result, "Trigger created successfully");
}

export default { create };
