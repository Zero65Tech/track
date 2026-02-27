import transaction from "../utils/transaction.js";

import EntryModel from "../models/Entry.js";
import { EntryType } from "@shared/enums";

import {
  _logCreateAudit,
  _logUpdateAudit,
  _logDeleteAudit,
} from "./auditLogService.js";

async function getEntries(profileId, filters) {
  const dataArr = await EntryModel.find({ profileId, ...filters })
    .limit(1000)
    .lean();

  for (let data of dataArr) {
    data.id = data._id.toString();
    delete data["_id"];
    delete data["profileId"];
  }

  return dataArr;
}

async function getSourceEntries(profileId, sourceId, fromDate, toDate) {
  const filter = {
    profileId,
    $or: [
      {
        type: {
          $in: [
            EntryType.CREDIT.id,
            EntryType.DEBIT.id,
            EntryType.INCOME.id,
            EntryType.EXPENSE.id,
            EntryType.REFUND.id,
            EntryType.TAX.id,
            EntryType.PAYMENT.id,
            EntryType.RECEIPT.id,
          ],
        },
        sourceId,
      },
      {
        type: EntryType.TRANSFER.id,
        $or: [{ sourceIdFrom: sourceId }, { sourceIdTo: sourceId }],
      },
    ],
  };

  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = fromDate;
    if (toDate) filter.date.$lte = toDate;
  }

  const dataArr = await EntryModel.find(filter)
    .sort({ date: 1 })
    .limit(1000) // Safety limit
    .lean();

  for (let data of dataArr) {
    data.id = data._id.toString();
    delete data["_id"];
    delete data["profileId"];
  }

  return dataArr;
}

async function _aggregateEntries(profileId, aggregationName) {
  const { default: pipelineBuilder } = await import(
    `../config/aggregations/${aggregationName}.js`
  );
  const aggregationPipeline = pipelineBuilder(profileId);
  return await EntryModel.aggregate(aggregationPipeline);
}

async function createEntry(userId, profileId, data) {
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

  data.id = data._id.toString();
  delete data["_id"];
  delete data["profileId"];

  return data;
}

async function updateEntry(userId, profileId, entryId, updates) {
  const data = await transaction(async (session) => {
    const doc = await EntryModel.findOne({ profileId, _id: entryId }).session(
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

  data.id = data._id.toString();
  delete data["_id"];
  delete data["profileId"];

  return data;
}

async function deleteEntry(userId, profileId, entryId) {
  await transaction(async (session) => {
    const doc = await EntryModel.findOne({ profileId, _id: entryId }).session(
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

export { _aggregateEntries };

export default { getEntries, getSourceEntries, createEntry, updateEntry, deleteEntry };
