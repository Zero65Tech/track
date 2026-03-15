import { createEntrySchema, updateEntrySchema } from "@shared/schemas";
import {
  sendData,
  sendSuccess,
  sendBadRequestError,
} from "../utils/response.js";
import entryService from "../services/entryService.js";

async function getEntries(req, res) {
  const entries = await entryService.getEntries(
    req.params.profileId,
    req.query,
  );
  sendData(res, { entries });
}

async function getBookEntries(req, res) {
  const profileId = req.params.profileId;
  const bookId = req.params.bookId;
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const entries = await entryService.getBookEntries(
    profileId,
    bookId,
    fromDate,
    toDate,
  );
  sendData(res, { entries });
}

async function getHeadEntries(req, res) {
  const profileId = req.params.profileId;
  const headId = req.params.headId;
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const entries = await entryService.getHeadEntries(
    profileId,
    headId,
    fromDate,
    toDate,
  );
  sendData(res, { entries });
}

async function getTagEntries(req, res) {
  const profileId = req.params.profileId;
  const tagId = req.params.tagId;
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const entries = await entryService.getTagEntries(
    profileId,
    tagId,
    fromDate,
    toDate,
  );
  sendData(res, { entries });
}

async function getSourceEntries(req, res) {
  const profileId = req.params.profileId;
  const sourceId = req.params.sourceId;
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const entries = await entryService.getSourceEntries(
    profileId,
    sourceId,
    fromDate,
    toDate,
  );
  sendData(res, { entries });
}

async function createEntry(req, res) {
  const { success, error, data } = createEntrySchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const entry = await entryService.createEntry(
    req.user.uid,
    req.params.profileId,
    data,
  );
  sendData(res, { entry }, "Entry created successfully.");
}

async function updateEntry(req, res) {
  const {
    success,
    error,
    data: updates,
  } = updateEntrySchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const entry = await entryService.updateEntry(
    req.user.uid,
    req.params.profileId,
    req.params.id,
    updates,
  );
  sendData(res, { entry }, "Entry updated successfully.");
}

async function deleteEntry(req, res) {
  await entryService.deleteEntry(
    req.user.uid,
    req.params.profileId,
    req.params.id,
  );
  sendSuccess(res, "Entry deleted successfully");
}

export default {
  getEntries,
  getBookEntries,
  getHeadEntries,
  getTagEntries,
  getSourceEntries,
  createEntry,
  updateEntry,
  deleteEntry,
};
