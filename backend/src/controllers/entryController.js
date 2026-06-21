import mongoose from "mongoose";

import { DataSource } from "@shared/enums";
import { createEntrySchema, updateEntrySchema } from "@shared/schemas";
import {
  sendBadRequestError,
  sendData,
  sendSuccess,
} from "../utils/response.js";

import entryService from "../services/entryService.js";
import { _getCachedProfile } from "../services/profileService.js";
import { _sendFirebaseMessage } from "../services/userService.js";

async function getEntries(req, res) {
  const entries = await entryService.getEntries(
    new mongoose.Types.ObjectId(req.params.profileId),
    req.query,
  );

  for (let entry of entries) {
    entry.id = entry._id.toString();
    delete entry["_id"];
  }

  sendData(res, { entries });
}

async function getBookEntries(req, res) {
  const profileId = new mongoose.Types.ObjectId(req.params.profileId);
  const bookId = new mongoose.Types.ObjectId(req.params.bookId);
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const entries = await entryService.getBookEntries(
    profileId,
    bookId,
    fromDate,
    toDate,
  );

  for (let entry of entries) {
    entry.id = entry._id.toString();
    delete entry["_id"];
  }

  sendData(res, { entries });
}

async function getHeadEntries(req, res) {
  const profileId = new mongoose.Types.ObjectId(req.params.profileId);
  const headId = new mongoose.Types.ObjectId(req.params.headId);
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const entries = await entryService.getHeadEntries(
    profileId,
    headId,
    fromDate,
    toDate,
  );

  for (let entry of entries) {
    entry.id = entry._id.toString();
    delete entry["_id"];
  }

  sendData(res, { entries });
}

async function getTagEntries(req, res) {
  const profileId = new mongoose.Types.ObjectId(req.params.profileId);
  const tagId = new mongoose.Types.ObjectId(req.params.tagId);
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const entries = await entryService.getTagEntries(
    profileId,
    tagId,
    fromDate,
    toDate,
  );

  for (let entry of entries) {
    entry.id = entry._id.toString();
    delete entry["_id"];
  }

  sendData(res, { entries });
}

async function getSourceEntries(req, res) {
  const profileId = new mongoose.Types.ObjectId(req.params.profileId);
  const sourceId = new mongoose.Types.ObjectId(req.params.sourceId);
  const fromDate = req.query.fromDate;
  const toDate = req.query.toDate;
  const entries = await entryService.getSourceEntries(
    profileId,
    sourceId,
    fromDate,
    toDate,
  );

  for (let entry of entries) {
    entry.id = entry._id.toString();
    delete entry["_id"];
  }

  sendData(res, { entries });
}

async function createEntry(req, res) {
  const { success, error, data } = createEntrySchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const entry = await entryService.createEntry(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    { _src: DataSource.BACKEND_SERVICE_V5_5, ...data },
  );

  entry.id = entry._id.toString();
  delete entry["_id"];

  const profile = await _getCachedProfile(req.params.profileId);
  const userIds = [profile.owner, ...profile.editors, ...profile.viewers];
  const messageData = {
    profileId: req.params.profileId,
    trigger: JSON.stringify(entry),
  };
  await _sendFirebaseMessage(userIds, {}, messageData);

  sendSuccess(res, "Entry created successfully.");
}

async function updateEntry(req, res) {
  const { success, error, data } = updateEntrySchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const entry = await entryService.updateEntry(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    req.params.entryId,
    data,
  );

  entry.id = entry._id.toString();
  delete entry["_id"];

  const profile = await _getCachedProfile(req.params.profileId);
  const userIds = [profile.owner, ...profile.editors, ...profile.viewers];
  const messageData = {
    profileId: req.params.profileId,
    trigger: JSON.stringify(entry),
  };
  await _sendFirebaseMessage(userIds, {}, messageData);

  sendSuccess(res, "Entry updated successfully.");
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
