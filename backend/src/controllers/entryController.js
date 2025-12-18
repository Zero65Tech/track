import {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} from "../services/entryService.js";
import { sendData } from "../utils/response.js";

async function getAll(req, res) {
  const entries = await getEntries(req.params.profileId, req.query);
  sendData(res, { entries });
}

async function create(req, res) {
  const entry = await createEntry(req.user.uid, req.params.profileId, req.body);
  sendData(res, { entry }, "Entry created successfully.");
}

async function update(req, res) {
  const entry = await updateEntry(
    req.user.uid,
    req.params.profileId,
    req.params.id,
    req.body,
  );
  sendData(res, { entry }, "Entry updated successfully.");
}

async function remove(req, res) {
  await deleteEntry(req.user.uid, req.params.profileId, req.params.id);
  sendData(res, null, "Entry deleted successfully");
}

export default { getAll, create, update, remove };
