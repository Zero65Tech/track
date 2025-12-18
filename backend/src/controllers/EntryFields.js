import { sendData, sendBadRequestError } from "../utils/response.js";

import {
  bookService,
  headService,
  tagService,
  sourceService,
} from "../services/EntryFields.js";

class GenericController {
  constructor(name, service) {
    this.name = name;
    this.service = service;
  }

  getAll = async (req, res) => {
    const key = `${this.name.toLowerCase()}s`;
    const items = await this.service.getAll(req.params.profileId);
    sendData(res, { [key]: items });
  };

  create = async (req, res) => {
    const key = this.name.toLowerCase();
    const item = await this.service.create(
      req.user.uid,
      req.params.profileId,
      req.body,
    );
    sendData(res, { [key]: item }, `${this.name} created successfully.`);
  };

  update = async (req, res) => {
    const key = this.name.toLowerCase();
    const item = await this.service.update(
      req.user.uid,
      req.params.profileId,
      req.params.id,
      req.body,
    );
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

const bookController = new GenericController("Book", bookService);
const headController = new GenericController("Head", headService);
const tagController = new GenericController("Tag", tagService);
const sourceController = new GenericController("Source", sourceService);

export { bookController, headController, tagController, sourceController };
