import { AttributeState } from "@shared/enums";
import BookModel from "../models/Book.js";
import transaction from "../utils/transaction.js";
import {
  _logCreateAudit,
  _logDeleteAudit,
  _logUpdateAudit,
} from "./auditLogService.js";

async function getBooks(profileId) {
  return await BookModel.find({ profileId })
    .sort({ sortOrder: 1 })
    .select("-profileId")
    .lean();
}

async function createBook(userId, profileId, data) {
  data["profileId"] = profileId;
  data["state"] = AttributeState.ACTIVE.id;
  data = await transaction(async (session) => {
    const [doc] = await BookModel.create([data], { session });

    data = doc.toObject();
    await _logCreateAudit(
      { userId, docType: BookModel.collection.name, data },
      session,
    );

    return data;
  });

  delete data["profileId"];

  return data;
}

async function updateBook(userId, profileId, bookId, updates) {
  const data = await transaction(async (session) => {
    const doc = await BookModel.findOne({ profileId, _id: bookId }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${BookModel.modelName} not found !`);
    }

    const oldData = doc.toObject();

    doc.set(updates);
    await doc.save({ session });

    const newData = doc.toObject();

    await _logUpdateAudit(
      { userId, docType: BookModel.collection.name, oldData, newData },
      session,
    );

    return newData;
  });

  delete data["profileId"];

  return data;
}

async function deleteBook(profileId, bookId, userId) {
  await transaction(async (session) => {
    const doc = await BookModel.findOne({ profileId, _id: bookId }).session(
      session,
    );
    if (!doc) {
      throw new Error(`${BookModel.modelName} not found !`);
    }

    if (doc.state !== AttributeState.DISABLED.id) {
      throw new Error(
        `${BookModel.modelName} in "${doc.state}" state can not be deleted !`,
      );
    }

    // TODO: Ensure there are no Entries with this docId

    const data = doc.toObject();
    await _logDeleteAudit(
      { userId, docType: BookModel.collection.name, data },
      session,
    );

    await doc.deleteOne({ session });
  });
}

export default { createBook, deleteBook, getBooks, updateBook };
