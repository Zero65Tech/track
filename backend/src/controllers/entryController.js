import {
  getAll as getAllEntries,
  create as createEntry,
  update as updateEntry,
  remove as removeEntry,
} from "../services/entryService.js";
import { sendData } from "../utils/response.js";

async function getAll(req, res) {
  const entries = await getAllEntries(req.params.profileId, req.query);
  sendData(res, { entries });
}

async function create(req, res) {
  const entry = await createEntry(req.params.profileId, req.body, req.user.uid);
  sendData(res, { entry }, "Entry created successfully.");
}

async function update(req, res) {
  const entry = await updateEntry(
    req.params.profileId,
    req.params.id,
    req.body,
    req.user.uid,
  );
  sendData(res, { entry }, "Entry updated successfully.");
}

async function remove(req, res) {
  await removeEntry(req.params.profileId, req.params.id, req.user.uid);
  sendData(res, null, "Entry deleted successfully");
}

export default { getAll, create, update, remove };
