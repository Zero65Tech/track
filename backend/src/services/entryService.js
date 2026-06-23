import { EntryType } from "@shared/enums";
import transaction from "../utils/transaction.js";

import {
  _logCreateAudit,
  _logDeleteAudit,
  _logUpdateAudit,
} from "./auditLogService.js";

import EntryModel from "../models/Entry.js";

async function getEntries(profileId, filter, fromDate, toDate) {
  const query = { profileId, ...filter };

  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) {
      query.date.$gte = fromDate;
    }
    if (toDate) {
      query.date.$lte = toDate;
    }
  }

  return await EntryModel.find(query)
    .sort({ date: 1 })
    .limit(1000) // Safety limit
    .select("-profileId")
    .lean();
}

async function getBookEntries(profileId, bookId, fromDate, toDate) {
  return await getEntries(
    profileId,
    {
      type: {
        $in: [
          EntryType.CREDIT.id,
          EntryType.DEBIT.id,
          EntryType.INCOME.id,
          EntryType.EXPENSE.id,
          EntryType.REFUND.id,
          EntryType.TAX.id,
        ],
      },
      bookId,
    },
    fromDate,
    toDate,
  );
}

async function getHeadEntries(profileId, headId, fromDate, toDate) {
  return await getEntries(
    profileId,
    {
      type: {
        $in: [
          EntryType.CREDIT.id,
          EntryType.DEBIT.id,
          EntryType.INCOME.id,
          EntryType.EXPENSE.id,
          EntryType.REFUND.id,
          EntryType.TAX.id,
        ],
      },
      headId,
    },
    fromDate,
    toDate,
  );
}

async function getTagEntries(profileId, tagId, fromDate, toDate) {
  return await getEntries(
    profileId,
    {
      type: {
        $in: [
          EntryType.CREDIT.id,
          EntryType.DEBIT.id,
          EntryType.INCOME.id,
          EntryType.EXPENSE.id,
          EntryType.REFUND.id,
          EntryType.TAX.id,
        ],
      },
      tagId,
    },
    fromDate,
    toDate,
  );
}

async function getSourceEntries(profileId, sourceId, fromDate, toDate) {
  return await getEntries(
    profileId,
    {
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
        { type: EntryType.TRANSFER.id, sourceIdFrom: sourceId },
        { type: EntryType.TRANSFER.id, sourceIdTo: sourceId },
      ],
    },
    fromDate,
    toDate,
  );
}

async function getTodoEntries(profileId) {
  return await getEntries(profileId, {
    todo: { $exists: true },
  });
}

async function _aggregateEntries(
  profileId,
  aggregationName,
  aggregationParams,
) {
  const { default: pipelineBuilder } = await import(
    `../config/aggregations/${aggregationName}.js`
  );
  const aggregationPipeline = pipelineBuilder(profileId, aggregationParams);
  return await EntryModel.aggregate(aggregationPipeline);
}

async function createEntry(userId, profileId, data) {
  data = await transaction(async (session) => {
    const [doc] = await EntryModel.create([{ profileId, ...data }], {
      session,
    });

    data = doc.toObject();
    await _logCreateAudit(
      { userId, docType: EntryModel.collection.name, data },
      session,
    );

    return data;
  });

  delete data["profileId"];

  return data;
}

async function updateEntry(userId, profileId, entryId, updates) {
  const data = await transaction(async (session) => {
    const doc = await EntryModel.findOne({ profileId, _id: entryId }).session(
      session,
    );

    if (!doc) throw new Error("Entry not found !");

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

export default {
  getEntries,
  getHeadEntries,
  getBookEntries,
  getTagEntries,
  getSourceEntries,
  getTodoEntries,
  createEntry,
  updateEntry,
  deleteEntry,
};
