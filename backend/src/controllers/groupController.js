import { sendData } from "../utils/response.js";
import {
  getAll as getAllGroups,
  create as createGroup,
  update as updateGroup,
  remove as removeGroup,
} from "../services/groupService.js";

async function getAll(req, res) {
  const groups = await getAllGroups(req.params.profileId);
  sendData(res, { groups });
}

async function create(req, res) {
  const group = await createGroup(req.params.profileId, req.body, req.user.uid);
  sendData(res, { group }, "Group created successfully.");
}

async function update(req, res) {
  const group = await updateGroup(
    req.params.profileId,
    req.params.id,
    req.body,
    req.user.uid,
  );
  sendData(res, { group }, "Group updated successfully.");
}

async function remove(req, res) {
  await removeGroup(req.params.profileId, req.params.id, req.user.uid);
  sendData(res, null, "Group deleted successfully");
}

export default { getAll, create, update, remove };
