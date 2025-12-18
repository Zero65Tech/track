import transaction from "../utils/transaction.js";

import FolderModel from "../models/Folder.js";

import {
  _logCreateAudit,
  _logUpdateAudit,
  _logDeleteAudit,
} from "./auditLogService.js";

async function getFolders(profileId) {
  const dataArr = await FolderModel.find({ profileId })
    .sort({ sortOrder: 1 })
    .lean();

  for (let data of dataArr) {
    data.id = data._id.toString();
    delete data["_id"];
    delete data["profileId"];
  }

  return dataArr;
}

async function createFolder(userId, profileId, data) {
  data["profileId"] = profileId;
  data = await transaction(async (session) => {
    const [doc] = await FolderModel.create([data], { session });

    data = doc.toObject();
    await _logCreateAudit(
      { userId, docType: FolderModel.collection.name, data },
      session,
    );

    return data;
  });

  data.id = data._id.toString();
  delete data["_id"];
  delete data["profileId"];

  return data;
}

async function updateFolder(userId, profileId, folderId, updates) {
  const data = await transaction(async (session) => {
    const doc = await FolderModel.findOne({ profileId, _id: folderId }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${FolderModel.modelName} not found !`);
    }

    const oldData = doc.toObject();

    doc.set(updates);
    await doc.save({ session });

    const newData = doc.toObject();

    await _logUpdateAudit(
      { userId, docType: FolderModel.collection.name, oldData, newData },
      session,
    );

    return newData;
  });

  data.id = data._id.toString();
  delete data["_id"];
  delete data["profileId"];

  return data;
}

async function deleteFolder(userId, profileId, folderId) {
  await transaction(async (session) => {
    const doc = await FolderModel.findOne({ profileId, _id: folderId }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${FolderModel.modelName} not found !`);
    }

    const data = doc.toObject();
    await _logDeleteAudit(
      { userId, docType: FolderModel.collection.name, data },
      session,
    );

    await doc.deleteOne({ session });
  });
}

export { getFolders, createFolder, updateFolder, deleteFolder };
