import { createSourceSchema, updateSourceSchema } from "@shared/schemas";
import mongoose from "mongoose";
import sourceService from "../services/sourceService.js";
import {
  sendBadRequestError,
  sendData,
  sendSuccess,
} from "../utils/response.js";

async function getSources(req, res) {
  const sources = await sourceService.getSources(
    new mongoose.Types.ObjectId(req.params.profileId),
  );

  for (let source of sources) {
    source.id = source._id.toString();
    delete source["_id"];
    delete source["profileId"];
  }

  sendData(res, { sources });
}

async function createSource(req, res) {
  const { success, error, data } = createSourceSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const source = await sourceService.createSource(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    data,
  );

  source.id = source._id.toString();
  delete source["_id"];
  delete source["profileId"];

  sendData(res, { source }, "Source created successfully.");
}

async function updateSource(req, res) {
  const { success, error, data } = updateSourceSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const source = await sourceService.updateSource(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.sourceId),
    data,
  );

  source.id = source._id.toString();
  delete source["_id"];
  delete source["profileId"];

  sendData(res, { source }, "Source updated successfully.");
}

async function deleteSource(req, res) {
  await sourceService.deleteSource(
    req.user.uid,
    new mongoose.Types.ObjectId(req.params.profileId),
    new mongoose.Types.ObjectId(req.params.sourceId),
  );

  sendSuccess(res, "Source deleted successfully");
}

export default { createSource, deleteSource, getSources, updateSource };
