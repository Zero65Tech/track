import { sendData } from "../utils/response.js";
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../services/folderService.js";

async function getAll(req, res) {
  const folders = await getFolders(req.params.profileId);
  sendData(res, { folders });
}

async function create(req, res) {
  const folder = await createFolder(
    req.user.uid,
    req.params.profileId,
    req.body,
  );
  sendData(res, { folder }, "Folder created successfully.");
}

async function update(req, res) {
  const folder = await updateFolder(
    req.user.uid,
    req.params.profileId,
    req.params.id,
    req.body,
  );
  sendData(res, { folder }, "Folder updated successfully.");
}

async function remove(req, res) {
  await deleteFolder(req.user.uid, req.params.profileId, req.params.id);
  sendData(res, null, "Folder deleted successfully");
}

export default { getAll, create, update, remove };
