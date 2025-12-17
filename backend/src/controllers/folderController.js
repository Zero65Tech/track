import { sendData } from "../utils/response.js";
import {
  getAll as getAllFolders,
  create as createFolder,
  update as updateFolder,
  remove as removeFolder,
} from "../services/folderService.js";

async function getAll(req, res) {
  const folders = await getAllFolders(req.params.profileId);
  sendData(res, { folders });
}

async function create(req, res) {
  const folder = await createFolder(
    req.params.profileId,
    req.body,
    req.user.uid,
  );
  sendData(res, { folder }, "Folder created successfully.");
}

async function update(req, res) {
  const folder = await updateFolder(
    req.params.profileId,
    req.params.id,
    req.body,
    req.user.uid,
  );
  sendData(res, { folder }, "Folder updated successfully.");
}

async function remove(req, res) {
  await removeFolder(req.params.profileId, req.params.id, req.user.uid);
  sendData(res, null, "Folder deleted successfully");
}

export default { getAll, create, update, remove };
