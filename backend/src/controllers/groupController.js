import { sendData } from "../utils/response.js";
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../services/groupService.js";

async function getAll(req, res) {
  const groups = await getGroups(req.params.profileId);
  sendData(res, { groups });
}

async function create(req, res) {
  const group = await createGroup(req.user.uid, req.params.profileId, req.body);
  sendData(res, { group }, "Group created successfully.");
}

async function update(req, res) {
  const group = await updateGroup(
    req.user.uid,
    req.params.profileId,
    req.params.id,
    req.body,
  );
  sendData(res, { group }, "Group updated successfully.");
}

async function remove(req, res) {
  await deleteGroup(req.user.uid, req.params.profileId, req.params.id);
  sendData(res, null, "Group deleted successfully");
}

export default { getAll, create, update, remove };
