import transaction from "../utils/transaction.js";

import FolderModel from "../models/Folder.js";

import auditLogService from "./auditLogService.js";

async function getAll(profileId) {
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

async function create(profileId, data, userId) {
  data["profileId"] = profileId;
  data = await transaction(async (session) => {
    const [doc] = await FolderModel.create([data], { session });

    data = doc.toObject();
    await auditLogService._logCreate(
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

async function update(profileId, id, updates, userId) {
  const data = await transaction(async (session) => {
    const doc = await FolderModel.findOne({ profileId, _id: id }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${FolderModel.modelName} not found !`);
    }

    const oldData = doc.toObject();

    doc.set(updates);
    await doc.save({ session });

    const newData = doc.toObject();

    await auditLogService._logUpdate(
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

async function remove(profileId, id, userId) {
  await transaction(async (session) => {
    const doc = await FolderModel.findOne({ profileId, _id: id }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${FolderModel.modelName} not found !`);
    }

    const data = doc.toObject();
    await auditLogService._logDelete(
      { userId, docType: FolderModel.collection.name, data },
      session,
    );

    await doc.deleteOne({ session });
  });
}

export default {
  getAll,
  create,
  update,
  remove,
};
