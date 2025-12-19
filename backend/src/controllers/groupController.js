import { createGroupSchema, updateGroupSchema } from "@shared/schemas";
import { sendData, sendBadRequestError } from "../utils/response.js";
import groupService from "../services/groupService.js";

async function getGroups(req, res) {
  const groups = await groupService.getGroups(req.params.profileId);
  sendData(res, { groups });
}

async function createGroup(req, res) {
  const { success, error, data } = createGroupSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const group = await groupService.createGroup(
    req.user.uid,
    req.params.profileId,
    data,
  );
  sendData(res, { group }, "Group created successfully.");
}

async function updateGroup(req, res) {
  const {
    success,
    error,
    data: updates,
  } = updateGroupSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const group = await groupService.updateGroup(
    req.user.uid,
    req.params.profileId,
    req.params.id,
    updates,
  );
  sendData(res, { group }, "Group updated successfully.");
}

async function deleteGroup(req, res) {
  await groupService.deleteGroup(
    req.user.uid,
    req.params.profileId,
    req.params.id,
  );
  sendData(res, null, "Group deleted successfully");
}

export default { getGroups, createGroup, updateGroup, deleteGroup };
