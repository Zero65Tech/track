import { AttributeState } from "@shared/enums";
import SourceModel from "../models/Source.js";
import transaction from "../utils/transaction.js";
import {
  _logCreateAudit,
  _logDeleteAudit,
  _logUpdateAudit,
} from "./auditLogService.js";

async function getSources(profileId) {
  const dataArr = await SourceModel.find({ profileId })
    .sort({ sortOrder: 1 })
    .lean();

  dataArr.forEach((data) => delete data["profileId"]);

  return dataArr;
}

async function createSource(userId, profileId, data) {
  data["profileId"] = profileId;
  data["state"] = AttributeState.ACTIVE.id;
  data = await transaction(async (session) => {
    const [doc] = await SourceModel.create([data], { session });

    data = doc.toObject();
    await _logCreateAudit(
      { userId, docType: SourceModel.collection.name, data },
      session,
    );

    return data;
  });

  delete data["profileId"];

  return data;
}

async function updateSource(userId, profileId, sourceId, updates) {
  const data = await transaction(async (session) => {
    const doc = await SourceModel.findOne({ profileId, _id: sourceId }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${SourceModel.modelName} not found !`);
    }

    const oldData = doc.toObject();

    doc.set(updates);
    await doc.save({ session });

    const newData = doc.toObject();

    await _logUpdateAudit(
      { userId, docType: SourceModel.collection.name, oldData, newData },
      session,
    );

    return newData;
  });

  delete data["profileId"];

  return data;
}

async function deleteSource(profileId, sourceId, userId) {
  await transaction(async (session) => {
    const doc = await SourceModel.findOne({ profileId, _id: sourceId }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${SourceModel.modelName} not found !`);
    }

    if (doc.state !== AttributeState.DISABLED.id) {
      throw new Error(
        `${SourceModel.modelName} in "${doc.state}" state can not be deleted !`,
      );
    }

    // TODO: Ensure there are no Entries with this docId

    const data = doc.toObject();
    await _logDeleteAudit(
      { userId, docType: SourceModel.collection.name, data },
      session,
    );

    await doc.deleteOne({ session });
  });
}

export default { createSource, deleteSource, getSources, updateSource };
