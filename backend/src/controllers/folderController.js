import { createFolderSchema, updateFolderSchema } from "@shared/schemas";
import {
  sendData,
  sendSuccess,
  sendBadRequestError,
} from "../utils/response.js";
import folderService from "../services/folderService.js";
import mongoose from "mongoose";

async function getFolders(req, res) {
  const folders = await folderService.getFolders(
    new mongoose.Types.ObjectId(req.params.profileId),
  );

  for (let folder of folders) {
    folder.id = folder._id.toString();
    delete folder["_id"];
    delete folder["profileId"];
  }

  sendData(res, { folders });
}

async function createFolder(req, res) {
  const { success, error, data } = createFolderSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  if (data.parentId) {
    data.parentId = new mongoose.Types.ObjectId(data.parentId);
  }

  const folder = await folderService.createFolder(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    data,
  );

  folder.id = folder._id.toString();
  delete folder["_id"];
  delete folder["profileId"];

  sendData(res, { folder }, "Folder created successfully.");
}

async function updateFolder(req, res) {
  const { success, error, data } = updateFolderSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  if (data.parentId) {
    data.parentId = new mongoose.Types.ObjectId(data.parentId);
  }

  const folder = await folderService.updateFolder(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.folderId),
    data,
  );

  folder.id = folder._id.toString();
  delete folder["_id"];
  delete folder["profileId"];

  sendData(res, { folder }, "Folder updated successfully.");
}

async function deleteFolder(req, res) {
  await folderService.deleteFolder(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.folderId),
  );

  sendSuccess(res, "Folder deleted successfully");
}

export default { getFolders, createFolder, updateFolder, deleteFolder };
