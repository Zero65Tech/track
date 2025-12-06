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
    const heads = await this.service.getAll(req.params.profileId);
    sendData(res, { heads });
  };

  create = async (req, res) => {
    const head = await this.service.create(
      req.params.profileId,
      req.body,
      req.user.uid,
    );
    sendData(res, { head }, `${this.name} created successfully.`);
  };

  update = async (req, res) => {
    const head = await this.service.update(
      req.params.profileId,
      req.params.id,
      req.body,
      req.user.uid,
    );
    sendData(res, { head }, `${this.name} updated successfully.`);
  };

  bulkUpdateSortOrder = async (req, res) => {
    // TODO
    const { profileId } = req.params;
    const { ids } = req.body;
    if (!Array.isArray(ids))
      return sendBadRequestError(res, "ids must be an array");
    const result = await this.service.bulkUpdateSortOrder(profileId, ids);
    sendData(res, result, `${this.name}s reordered successfully`);
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
