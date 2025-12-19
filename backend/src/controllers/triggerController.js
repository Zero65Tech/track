import { createDataAggregationTriggerSchema } from "@shared/schemas";
import { sendData, sendBadRequestError } from "../utils/response.js";
import triggerService from "../services/triggerService.js";

async function createDataAggregationTrigger(req, res) {
  const { success, error, data } = createDataAggregationTriggerSchema.safeParse(
    req.body,
  );
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const result = await triggerService.createDataAggregationTrigger(
    req.user.uid,
    req.params.profileId,
    data.aggregationName,
  );

  sendData(res, result, "Trigger created successfully");
}

export default { createDataAggregationTrigger };
