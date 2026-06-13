import { EntryFieldState } from "@shared/enums";
import TagModel from "../models/Tag.js";
import transaction from "../utils/transaction.js";
import {
  _logCreateAudit,
  _logDeleteAudit,
  _logUpdateAudit,
} from "./auditLogService.js";

async function getTags(profileId) {
  return await TagModel.find({ profileId }).sort({ sortOrder: 1 }).lean();
}

async function createTag(userId, profileId, data) {
  data["profileId"] = profileId;
  data["state"] = EntryFieldState.ACTIVE.id;
  data = await transaction(async (session) => {
    const [doc] = await TagModel.create([data], { session });

    data = doc.toObject();
    await _logCreateAudit(
      { userId, docType: TagModel.collection.name, data },
      session,
    );

    return data;
  });

  return data;
}

async function updateTag(userId, profileId, tagId, updates) {
  const data = await transaction(async (session) => {
    const doc = await TagModel.findOne({ profileId, _id: tagId }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${TagModel.modelName} not found !`);
    }

    const oldData = doc.toObject();

    doc.set(updates);
    await doc.save({ session });

    const newData = doc.toObject();

    await _logUpdateAudit(
      { userId, docType: TagModel.collection.name, oldData, newData },
      session,
    );

    return newData;
  });

  return data;
}

async function deleteTag(profileId, tagId, userId) {
  await transaction(async (session) => {
    const doc = await TagModel.findOne({ profileId, _id: tagId }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${TagModel.modelName} not found !`);
    }

    if (doc.state !== EntryFieldState.DISABLED.id) {
      throw new Error(
        `${TagModel.modelName} in "${doc.state}" state can not be deleted !`,
      );
    }

    // TODO: Ensure there are no Entries with this docId

    const data = doc.toObject();
    await _logDeleteAudit(
      { userId, docType: TagModel.collection.name, data },
      session,
    );

    await doc.deleteOne({ session });
  });
}

export default { createTag, deleteTag, getTags, updateTag };
