import transaction from "../utils/transaction.js";

import GroupModel from "../models/Group.js";

import {
  _logCreateAudit,
  _logUpdateAudit,
  _logDeleteAudit,
} from "./auditLogService.js";

async function getAll(profileId) {
  const dataArr = await GroupModel.find({ profileId }).lean();

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
    const [doc] = await GroupModel.create([data], { session });

    data = doc.toObject();
    await _logCreateAudit(
      { userId, docType: GroupModel.collection.name, data },
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
    const doc = await GroupModel.findOne({ profileId, _id: id }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${GroupModel.modelName} not found !`);
    }

    const oldData = doc.toObject();

    doc.set(updates);
    await doc.save({ session });

    const newData = doc.toObject();

    await _logUpdateAudit(
      { userId, docType: GroupModel.collection.name, oldData, newData },
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
    const doc = await GroupModel.findOne({ profileId, _id: id }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${GroupModel.modelName} not found !`);
    }

    const data = doc.toObject();
    await _logDeleteAudit(
      { userId, docType: GroupModel.collection.name, data },
      session,
    );

    await doc.deleteOne({ session });
  });
}

export { getAll, create, update, remove };
