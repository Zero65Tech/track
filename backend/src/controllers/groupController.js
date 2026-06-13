import { createGroupSchema, updateGroupSchema } from "@shared/schemas";
import {
  sendData,
  sendSuccess,
  sendBadRequestError,
} from "../utils/response.js";
import groupService from "../services/groupService.js";
import mongoose from "mongoose";

async function getGroups(req, res) {
  const groups = await groupService.getGroups(
    new mongoose.Types.ObjectId(req.params.profileId),
  );

  sendData(res, { groups });
}

async function createGroup(req, res) {
  const { success, error, data } = createGroupSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  if (data.folderIds) {
    data.folderIds = data.folderIds.map(
      (folderId) => new mongoose.Types.ObjectId(folderId),
    );
  }

  const group = await groupService.createGroup(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    data,
  );

  sendData(res, { group }, "Group created successfully.");
}

async function updateGroup(req, res) {
  const { success, error, data } = updateGroupSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  if (data.folderIds) {
    data.folderIds = data.folderIds.map(
      (folderId) => new mongoose.Types.ObjectId(folderId),
    );
  }

  const group = await groupService.updateGroup(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.groupId),
    data,
  );

  sendData(res, { group }, "Group updated successfully.");
}

async function deleteGroup(req, res) {
  await groupService.deleteGroup(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.groupId),
  );

  sendSuccess(res, "Group deleted successfully");
}

export default { getGroups, createGroup, updateGroup, deleteGroup };
