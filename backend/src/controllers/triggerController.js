import mongoose from "mongoose";

import {
  createDataAggregationTriggerSchema,
  getTriggersSchema,
  processTriggersSchema,
} from "@shared/schemas";
import {
  sendBadRequestError,
  sendData,
  sendSuccess,
} from "../utils/response.js";

import { _getCachedProfile } from "../services/profileService.js";
import triggerService from "../services/triggerService.js";
import { _sendFirebaseMessage } from "../services/userService.js";

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

  const profile = await _getCachedProfile(req.params.profileId);
  const userIds = [profile.owner, ...profile.editors, ...profile.viewers];
  const messageData = {
    profileId: req.params.profileId,
    trigger: JSON.stringify(trigger),
  };
  await _sendFirebaseMessage(userIds, {}, messageData);

  sendSuccess(res, "Trigger created successfully");
}

async function processTriggers(req, res) {
  const { success, error, data } = processTriggersSchema.safeParse(req.query);

  if (!success) return sendBadRequestError(res, error);

  const processedCount = await triggerService.processTriggers(
    async (trigger) => {
      const profileId = trigger.profileId.toString();

      trigger.id = trigger._id.toString();
      delete trigger._id;
      delete trigger.profileId;

      const profile = await _getCachedProfile(profileId);
      const userIds = [profile.owner, ...profile.editors, ...profile.viewers];

      const messageData = {
        profileId: profileId,
        trigger: JSON.stringify(trigger),
      };
      await _sendFirebaseMessage(userIds, {}, messageData);
    },
    process.env.INSTANCE_ID,
    data.limit || 100,
  );

  sendSuccess(res, `Triggers processed successfully (${processedCount})`);
}

export default { getTriggers, createDataAggregationTrigger, processTriggers };
