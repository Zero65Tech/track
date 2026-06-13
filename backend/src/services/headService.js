import { EntryFieldState } from "@shared/enums";
import HeadModel from "../models/Head.js";
import transaction from "../utils/transaction.js";
import {
  _logCreateAudit,
  _logDeleteAudit,
  _logUpdateAudit,
} from "./auditLogService.js";

async function getHeads(profileId) {
  return await HeadModel.find({ profileId }).sort({ sortOrder: 1 }).lean();
}

async function createHead(userId, profileId, data) {
  data["profileId"] = profileId;
  data["state"] = EntryFieldState.ACTIVE.id;
  data = await transaction(async (session) => {
    const [doc] = await HeadModel.create([data], { session });

    data = doc.toObject();
    await _logCreateAudit(
      { userId, docType: HeadModel.collection.name, data },
      session,
    );

    return data;
  });

  return data;
}

async function updateHead(userId, profileId, headId, updates) {
  const data = await transaction(async (session) => {
    const doc = await HeadModel.findOne({ profileId, _id: headId }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${HeadModel.modelName} not found !`);
    }

    const oldData = doc.toObject();

    doc.set(updates);
    await doc.save({ session });

    const newData = doc.toObject();

    await _logUpdateAudit(
      { userId, docType: HeadModel.collection.name, oldData, newData },
      session,
    );

    return newData;
  });

  return data;
}

async function deleteHead(profileId, headId, userId) {
  await transaction(async (session) => {
    const doc = await HeadModel.findOne({ profileId, _id: headId }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${HeadModel.modelName} not found !`);
    }

    if (doc.state !== EntryFieldState.DISABLED.id) {
      throw new Error(
        `${HeadModel.modelName} in "${doc.state}" state can not be deleted !`,
      );
    }

    // TODO: Ensure there are no Entries with this docId

    const data = doc.toObject();
    await _logDeleteAudit(
      { userId, docType: HeadModel.collection.name, data },
      session,
    );

    await doc.deleteOne({ session });
  });
}

export default { createHead, deleteHead, getHeads, updateHead };
