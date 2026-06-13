import { createHeadSchema, updateHeadSchema } from "@shared/schemas";
import mongoose from "mongoose";
import { headService } from "../services/EntryFields.js";
import {
  sendBadRequestError,
  sendData,
  sendSuccess,
} from "../utils/response.js";

async function getHeads(req, res) {
  const heads = await headService.getHeads(
    new mongoose.Types.ObjectId(req.params.profileId),
  );

  for (let head of heads) {
    head.id = head._id.toString();
    delete head["_id"];
    delete head["profileId"];
  }

  sendData(res, { heads });
}

async function createHead(req, res) {
  const { success, error, data } = createHeadSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const head = await headService.createHead(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    data,
  );

  head.id = head._id.toString();
  delete head["_id"];
  delete head["profileId"];

  sendData(res, { head }, "Head created successfully.");
}

async function updateHead(req, res) {
  const { success, error, data } = updateHeadSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const head = await headService.updateHead(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.headId),
    data,
  );

  head.id = head._id.toString();
  delete head["_id"];
  delete head["profileId"];

  sendData(res, { head }, "Head updated successfully.");
}

async function deleteHead(req, res) {
  await headService.deleteHead(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.headId),
  );

  sendSuccess(res, "Head deleted successfully");
}

export default { createHead, deleteHead, getHeads, updateHead };
