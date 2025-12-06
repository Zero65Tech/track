import { LRUCache } from "lru-cache";
import { ProfileAccess, ProfileState } from "@zero65/track";

import idMappings from "../config/idMappings.js";
import transaction from "../utils/transaction.js";

import ProfileModel from "../models/Profile.js";

import auditLogService from "./auditLogService.js";
import coinLedger from "./coinLedger.js";

const cache = new LRUCache({
  max: 1024,
  ttl: 1000 * 60 * 60 * 3, // 3 hours
});

async function _getCached(id) {
  id = typeof id === "string" ? id : id.toString();
  let data = cache.get(id);
  if (!data) {
    data = await ProfileModel.findById(id).lean();
    cache.set(id, data);
  }
  return data;
}

async function getAll(userId) {
  const dataArr = await ProfileModel.find({
    $or: [{ owner: userId }, { editors: userId }, { viewers: userId }],
  })
    .sort({ createdAt: 1 })
    .lean();

  for (let i = 0; i < dataArr.length; i++) {
    cache.set(dataArr[i]._id.toString(), dataArr[i]);
    dataArr[i] = {
      _id: dataArr[i]._id, // DEPRECATE: _id in response
      id: dataArr[i]._id.toString(),
      name: dataArr[i].name,
      access:
        dataArr[i].owner == userId
          ? ProfileAccess.OWNER.id
          : dataArr[i].editors && dataArr[i].editors.includes(userId)
            ? ProfileAccess.EDITOR.id
            : ProfileAccess.VIEWER.id,
      state: dataArr[i].state,
    };
  }

  return dataArr;
}

async function getSystemTemplates() {
  const dataArr = await ProfileModel.find({
    owner: idMappings.user.system,
    state: ProfileState.TEMPLATE.id,
  }).lean();

  for (let i = 0; i < dataArr.length; i++) {
    cache.set(dataArr[i]._id.toString(), dataArr[i]);
    dataArr[i] = {
      _id: dataArr[i]._id, // DEPRECATE: _id in response
      id: dataArr[i]._id.toString(),
      name: dataArr[i].name,
    };
  }

  return dataArr;
}

async function create(name, userId) {
  const data = await transaction(async (session) => {
    const [doc] = await ProfileModel.create(
      [{ name, owner: userId, state: ProfileState.INACTIVE.id }],
      { session },
    );

    const data = doc.toObject();
    await auditLogService._logCreate(
      { userId, docType: ProfileModel.collection.name, data },
      session,
    );

    // TODO: Remove dependency on coinLedger
    await coinLedger._init({ profileId: doc._id }, session);

    return data;
  });

  cache.set(data._id.toString(), data);

  return {
    _id: data._id, // DEPRECATE: _id in response
    id: data._id.toString(),
    name: data.name,
    access: ProfileAccess.OWNER.id,
    state: data.state,
  };
}

async function update(id, updates, userId) {
  const data = await transaction(async (session) => {
    const doc = await ProfileModel.findById(id).session(session);
    if (!doc) {
      throw new Error(`${ProfileModel.modelName} not found !`);
    }

    const oldData = doc.toObject();

    if (updates.name) doc.name = updates.name;
    if (updates.state) doc.state = updates.state;
    await doc.save({ session });

    const newData = doc.toObject();

    await auditLogService._logUpdate(
      { userId, docType: ProfileModel.collection.name, oldData, newData },
      session,
    );

    return newData;
  });

  cache.set(data._id.toString(), data);

  return {
    _id: data._id, // DEPRECATE: _id in response
    id: data._id.toString(),
    name: data.name,
    access: ProfileAccess.OWNER.id,
    state: data.state,
  };
}

async function _update({ id, updates }, session) {
  await ProfileModel.updateOne(
    { _id: id },
    { $set: updates },
    { upsert: false },
  ).session(session);
  cache.delete(id);
}

export default {
  _getCached,
  getAll,
  getSystemTemplates,
  create,
  update,
  _update,
};
