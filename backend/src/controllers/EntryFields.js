import {
  createBookSchema,
  updateBookSchema,
  createHeadSchema,
  updateHeadSchema,
  createTagSchema,
  updateTagSchema,
  createSourceSchema,
  updateSourceSchema,
} from "@shared/schemas";

import { sendData, sendBadRequestError } from "../utils/response.js";

import {
  bookService,
  headService,
  tagService,
  sourceService,
} from "../services/EntryFields.js";

class GenericController {
  constructor(name, service, createSchema, updateSchema) {
    this.name = name;
    this.service = service;
    this.createSchema = createSchema;
    this.updateSchema = updateSchema;
  }

  getAll = async (req, res) => {
    const key = `${this.name.toLowerCase()}s`;
    const items = await this.service.getAll(req.params.profileId);
    sendData(res, { [key]: items });
  };

  create = async (req, res) => {
    const { success, error, data } = this.createSchema.safeParse(req.body);
    if (!success) {
      return sendBadRequestError(res, error);
    }

    const item = await this.service.create(
      req.user.uid,
      req.params.profileId,
      data,
    );

    const key = this.name.toLowerCase();
    sendData(res, { [key]: item }, `${this.name} created successfully.`);
  };

  update = async (req, res) => {
    const {
      success,
      error,
      data: updates,
    } = this.updateSchema.safeParse(req.body);
    if (!success) {
      return sendBadRequestError(res, error);
    }

    const item = await this.service.update(
      req.user.uid,
      req.params.profileId,
      req.params.id,
      updates,
    );

    const key = this.name.toLowerCase();
    sendData(res, { [key]: item }, `${this.name} updated successfully.`);
  };

  remove = async (req, res) => {
    await this.service.remove(
      req.params.profileId,
      req.params.id,
      req.user.uid,
    );
    sendData(res, null, `${this.name} deleted successfully`);
  };
}

const bookController = new GenericController(
  "Book",
  bookService,
  createBookSchema,
  updateBookSchema,
);
const headController = new GenericController(
  "Head",
  headService,
  createHeadSchema,
  updateHeadSchema,
);
const tagController = new GenericController(
  "Tag",
  tagService,
  createTagSchema,
  updateTagSchema,
);
const sourceController = new GenericController(
  "Source",
  sourceService,
  createSourceSchema,
  updateSourceSchema,
);

export { bookController, headController, tagController, sourceController };
