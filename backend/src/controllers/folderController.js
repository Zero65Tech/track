import { createFolderSchema, updateFolderSchema } from "@shared/schemas";
import { sendData, sendBadRequestError } from "../utils/response.js";
import folderService from "../services/folderService.js";

async function getFolders(req, res) {
  const folders = await folderService.getFolders(req.params.profileId);
  sendData(res, { folders });
}

async function createFolder(req, res) {
  const { success, error, data } = createFolderSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const folder = await folderService.createFolder(
    req.user.uid,
    req.params.profileId,
    data,
  );
  sendData(res, { folder }, "Folder created successfully.");
}

async function updateFolder(req, res) {
  const {
    success,
    error,
    data: updates,
  } = updateFolderSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const folder = await folderService.updateFolder(
    req.user.uid,
    req.params.profileId,
    req.params.id,
    updates,
  );
  sendData(res, { folder }, "Folder updated successfully.");
}

async function deleteFolder(req, res) {
  await folderService.deleteFolder(
    req.user.uid,
    req.params.profileId,
    req.params.id,
  );
  sendData(res, null, "Folder deleted successfully");
}

export default { getFolders, createFolder, updateFolder, deleteFolder };
