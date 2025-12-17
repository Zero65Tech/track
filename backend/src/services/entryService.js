import transaction from "../utils/transaction.js";

import EntryModel from "../models/Entry.js";

import {
  _logCreateAudit,
  _logUpdateAudit,
  _logDeleteAudit,
} from "./auditLogService.js";

async function getAll(profileId, filters) {
  const dataArr = await EntryModel.find({ profileId, ...filters })
    .limit(1000)
    .lean();

  for (let data of dataArr) {
    delete data["profileId"];
    // DEPRECATE: _id in response
    data.id = data._id.toString();
  }

  return dataArr;
}

async function create(profileId, data, userId) {
  data["profileId"] = profileId;
  data = await transaction(async (session) => {
    const [doc] = await EntryModel.create([data], { session });

    data = doc.toObject();
    await _logCreateAudit(
      { userId, docType: EntryModel.collection.name, data },
      session,
    );

    return data;
  });
  delete data["profileId"];
  // DEPRECATE: _id in response
  data.id = data._id.toString();
}

async function update(profileId, id, updates, userId) {
  const data = await transaction(async (session) => {
    const doc = await EntryModel.findOne({ profileId, _id: id }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${EntryModel.modelName} not found !`);
    }

    const oldData = doc.toObject();

    doc.set(updates);
    await doc.save({ session });

    const newData = doc.toObject();

    await _logUpdateAudit(
      { userId, docType: EntryModel.collection.name, oldData, newData },
      session,
    );

    return newData;
  });
  delete data["profileId"];
  // DEPRECATE: _id in response
  data.id = data._id.toString();
}

async function remove(profileId, id, userId) {
  await transaction(async (session) => {
    const doc = await EntryModel.findOne({ profileId, _id: id }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${EntryModel.modelName} not found !`);
    }

    const data = doc.toObject();
    await _logDeleteAudit(
      { userId, docType: EntryModel.collection.name, data },
      session,
    );

    await doc.deleteOne({ session });
  });
}

async function aggregateByPipeline(profileId, aggregationPipeline) {
  const result = await EntryModel.aggregate(aggregationPipeline);
  return result;
}

export { getAll, create, update, remove, aggregateByPipeline };
