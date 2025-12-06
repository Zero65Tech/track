import { sendData } from "../utils/response.js";
import folderService from "../services/folderService.js";

async function getAll(req, res) {
  const folders = await folderService.getAll(req.params.profileId);
  sendData(res, { folders });
}

async function create(req, res) {
  const folder = await folderService.create(
    req.params.profileId,
    req.body,
    req.user.uid,
  );
  sendData(res, { folder }, "Folder created successfully.");
}

async function update(req, res) {
  const folder = await folderService.update(
    req.params.profileId,
    req.params.id,
    req.body,
    req.user.uid,
  );
  sendData(res, { folder }, "Folder updated successfully.");
}

async function remove(req, res) {
  await folderService.remove(req.params.profileId, req.params.id, req.user.uid);
  sendData(res, null, "Folder deleted successfully");
}

export default { getAll, create, update, remove };
