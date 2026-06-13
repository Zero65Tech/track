import { createTagSchema, updateTagSchema } from "@shared/schemas";
import mongoose from "mongoose";
import tagService from "../services/tagService.js";
import {
  sendBadRequestError,
  sendData,
  sendSuccess,
} from "../utils/response.js";

async function getTags(req, res) {
  const tags = await tagService.getTags(
    new mongoose.Types.ObjectId(req.params.profileId),
  );

  for (let tag of tags) {
    tag.id = tag._id.toString();
    delete tag["_id"];
    delete tag["profileId"];
  }

  sendData(res, { tags });
}

async function createTag(req, res) {
  const { success, error, data } = createTagSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const tag = await tagService.createTag(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    data,
  );

  tag.id = tag._id.toString();
  delete tag["_id"];
  delete tag["profileId"];

  sendData(res, { tag }, "Tag created successfully.");
}

async function updateTag(req, res) {
  const { success, error, data } = updateTagSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const tag = await tagService.updateTag(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.tagId),
    data,
  );

  tag.id = tag._id.toString();
  delete tag["_id"];
  delete tag["profileId"];

  sendData(res, { tag }, "Tag updated successfully.");
}

async function deleteTag(req, res) {
  await tagService.deleteTag(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.tagId),
  );

  sendSuccess(res, "Tag deleted successfully");
}

export default { createTag, deleteTag, getTags, updateTag };
