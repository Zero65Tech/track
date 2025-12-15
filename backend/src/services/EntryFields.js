import { EntryFieldState } from "@zero65/track";

import transaction from "../utils/transaction.js";

import {
  BookModel,
  HeadModel,
  TagModel,
  SourceModel,
} from "../models/EntryFields.js";

import auditLogService from "./auditLogService.js";

class GenericService {
  constructor(model) {
    this.model = model;
  }

  getAll = async (profileId) => {
    const dataArr = await this.model
      .find({ profileId })
      .sort({ sortOrder: 1 })
      .lean();

    for (let data of dataArr) {
      data.id = data._id.toString();
      delete data["_id"];
      delete data["profileId"];
    }

    return dataArr;
  };

  create = async (profileId, data, userId) => {
    data["profileId"] = profileId;
    data["state"] = EntryFieldState.ACTIVE.id;
    data = await transaction(async (session) => {
      const [doc] = await this.model.create([data], { session });

      data = doc.toObject();
      await auditLogService._logCreate(
        { userId, docType: this.model.collection.name, data },
        session,
      );

      return data;
    });
    delete data["profileId"];
    // DEPRECATE: _id in response
    data.id = data._id.toString();
  };

  update = async (profileId, id, updates, userId) => {
    const data = await transaction(async (session) => {
      const doc = await this.model
        .findOne({ profileId, _id: id })
        .session(session);
      if (!doc) {
        throw new Error(`${this.model.modelName} not found !`);
      }

      const oldData = doc.toObject();

      doc.set(updates);
      await doc.save({ session });

      const newData = doc.toObject();

      await auditLogService._logUpdate(
        { userId, docType: this.model.collection.name, oldData, newData },
        session,
      );

      return newData;
    });
    delete data["profileId"];
    // DEPRECATE: _id in response
    data.id = data._id.toString();
  };

  bulkUpdateSortOrder = async (profileId, ids) => {
    // TODO
    return await transaction(async (session) => {
      const bulkOps = ids.map((id, index) => ({
        updateOne: {
          filter: { profileId, _id: id },
          update: { $set: { sortOrder: index + 1 } },
        },
      }));

      await this.model.bulkWrite(bulkOps, { session });
    });
  };

  remove = async (profileId, id, userId) => {
    await transaction(async (session) => {
      const doc = await this.model
        .findOne({ profileId, _id: id })
        .session(session);
      if (!doc) {
        throw new Error(`${this.model.modelName} not found !`);
      }

      if (doc.state !== EntryFieldState.DISABLED.id) {
        throw new Error(
          `${this.model.modelName} in "${doc.state}" state can not be deleted !`,
        );
      }

      // TODO: Ensure there are no Entries with this docId

      const data = doc.toObject();
      await auditLogService._logDelete(
        { userId, docType: this.model.collection.name, data },
        session,
      );

      await doc.deleteOne({ session });
    });
  };
}

const bookService = new GenericService(BookModel);
const headService = new GenericService(HeadModel);
const tagService = new GenericService(TagModel);
const sourceService = new GenericService(SourceModel);

export { bookService, headService, tagService, sourceService };
