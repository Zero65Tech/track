import transaction from "../utils/transaction.js";

import GroupModel from "../models/Group.js";

import {
  _logCreateAudit,
  _logUpdateAudit,
  _logDeleteAudit,
} from "./auditLogService.js";

async function getGroups(profileId) {
  const dataArr = await GroupModel.find({ profileId }).lean();

  for (let data of dataArr) {
    data.id = data._id.toString();
    delete data["_id"];
    delete data["profileId"];
  }

  return dataArr;
}

async function createGroup(userId, profileId, data) {
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

async function updateGroup(userId, profileId, groupId, updates) {
  const data = await transaction(async (session) => {
    const doc = await GroupModel.findOne({ profileId, _id: groupId }).session(
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

async function deleteGroup(userId, profileId, groupId) {
  await transaction(async (session) => {
    const doc = await GroupModel.findOne({ profileId, _id: groupId }).session(
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

export default { getGroups, createGroup, updateGroup, deleteGroup };
