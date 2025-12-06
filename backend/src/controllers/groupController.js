import { sendData } from "../utils/response.js";
import groupService from "../services/groupService.js";

async function getAll(req, res) {
  const groups = await groupService.getAll(req.params.profileId);
  sendData(res, { groups });
}

async function create(req, res) {
  const group = await groupService.create(
    req.params.profileId,
    req.body,
    req.user.uid,
  );
  sendData(res, { group }, "Group created successfully.");
}

async function update(req, res) {
  const group = await groupService.update(
    req.params.profileId,
    req.params.id,
    req.body,
    req.user.uid,
  );
  sendData(res, { group }, "Group updated successfully.");
}

async function remove(req, res) {
  await groupService.remove(req.params.profileId, req.params.id, req.user.uid);
  sendData(res, null, "Group deleted successfully");
}

export default { getAll, create, update, remove };
