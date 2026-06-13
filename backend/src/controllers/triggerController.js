import {
  getTriggersSchema,
  createDataAggregationTriggerSchema,
} from "@shared/schemas";
import { sendData, sendBadRequestError } from "../utils/response.js";
import triggerService from "../services/triggerService.js";
import mongoose from "mongoose";

async function getTriggers(req, res) {
  const { success, error, data } = getTriggersSchema.safeParse(req.query);

  if (!success) return sendBadRequestError(res, error);

  const triggers = await triggerService.getTriggers(
    new mongoose.Types.ObjectId(req.params.profileId),
    data.lastCreatedAt ? new Date(data.lastCreatedAt) : null,
    data.pageSize || 20,
  );

  for (const trigger of triggers) {
    trigger.id = trigger._id.toString();
    delete trigger._id;
    delete trigger.profileId;
  }

  sendData(res, { triggers });
}

async function createDataAggregationTrigger(req, res) {
  const { success, error, data } = createDataAggregationTriggerSchema.safeParse(
    req.body,
  );

  if (!success) return sendBadRequestError(res, error);

  const trigger = await triggerService.createDataAggregationTrigger(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    data.aggregationName,
    {
      type: data.entryType,
      bookId: data.bookId,
      headId: data.headId,
      tagId: data.tagId,
      sourceId: data.sourceId,
    },
  );

  trigger.id = trigger._id.toString();
  delete trigger._id;
  delete trigger.profileId;

  sendData(res, trigger, "Trigger created successfully");
}

export default { getTriggers, createDataAggregationTrigger };
