import { LRUCache } from "lru-cache";
import { ProfileAccess, ProfileState } from "@shared/enums";

import transaction from "../utils/transaction.js";
import ProfileModel from "../models/Profile.js";
import { lruCacheConfig } from "../config/cache.js";

import { _logCreateAudit, _logUpdateAudit } from "./auditLogService.js";
import { _createProfileCreatedTrigger } from "./triggerService.js";

const profileDataCache = new LRUCache(lruCacheConfig);

async function _getCachedProfile(profileId) {
  if (typeof profileId !== "string") {
    profileId = profileId.toString();
  }

  let data = profileDataCache.get(profileId);
  if (data === undefined) {
    data = await ProfileModel.findById(profileId).lean();
    profileDataCache.set(profileId, data);
  }

  return data;
}

async function getAccessibleProfiles(userId) {
  const dataArr = await ProfileModel.find({
    $or: [{ owner: userId }, { editors: userId }, { viewers: userId }],
  }).lean();

  for (let i = 0; i < dataArr.length; i++) {
    profileDataCache.set(dataArr[i]._id.toString(), dataArr[i]);
    dataArr[i] = {
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

async function getTemplateProfiles() {
  const dataArr = await ProfileModel.find({
    owner: process.env.SYSTEM_USER_ID,
    state: ProfileState.TEMPLATE.id,
  }).lean();

  for (let i = 0; i < dataArr.length; i++) {
    profileDataCache.set(dataArr[i]._id.toString(), dataArr[i]);
    dataArr[i] = {
      id: dataArr[i]._id.toString(),
      name: dataArr[i].name,
      access: ProfileAccess.VIEWER.id,
      state: ProfileState.TEMPLATE.id,
    };
  }

  return dataArr;
}

async function createProfile(userId, name) {
  const data = await transaction(async (session) => {
    const [doc] = await ProfileModel.create(
      [{ owner: userId, name, state: ProfileState.INACTIVE.id }],
      { session },
    );

    const data = doc.toObject();
    await _logCreateAudit(
      { userId, docType: ProfileModel.collection.name, data },
      session,
    );

    await _createProfileCreatedTrigger({ profileId: doc._id }, session);

    return data;
  });

  profileDataCache.set(data._id.toString(), data);

  return {
    id: data._id.toString(),
    name: data.name,
    access: ProfileAccess.OWNER.id,
    state: data.state,
  };
}

async function _updateProfile({ profileId, updates }, session) {
  await ProfileModel.updateOne(
    { _id: profileId },
    { $set: updates },
    { upsert: false },
  ).session(session);
  profileDataCache.delete(profileId);
}

async function updateProfile(userId, profileId, updates) {
  const data = await transaction(async (session) => {
    const doc = await ProfileModel.findById(profileId).session(session);
    if (!doc) {
      throw new Error(`${ProfileModel.modelName} not found !`);
    }

    const oldData = doc.toObject();

    if (updates.name) doc.name = updates.name;
    if (updates.state) doc.state = updates.state;
    await doc.save({ session });

    const newData = doc.toObject();

    await _logUpdateAudit(
      { userId, docType: ProfileModel.collection.name, oldData, newData },
      session,
    );

    return newData;
  });

  profileDataCache.set(data._id.toString(), data);

  return {
    id: data._id.toString(),
    name: data.name,
    access: ProfileAccess.OWNER.id,
    state: data.state,
  };
}

export { _getCachedProfile, _updateProfile };

export default {
  getAccessibleProfiles,
  getTemplateProfiles,
  createProfile,
  updateProfile,
};
