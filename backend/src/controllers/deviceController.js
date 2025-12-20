import { createDeviceSchema, updateDeviceSchema } from "@shared/schemas";
import {
  sendData,
  sendSuccess,
  sendBadRequestError,
} from "../utils/response.js";
import deviceService from "../services/deviceService.js";

async function createDevice(req, res) {
  const { success, error, data } = createDeviceSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const device = await deviceService.createDevice(data.fcmToken);

  return sendData(res, device);
}

async function updateDevice(req, res) {
  const { success, error, data } = updateDeviceSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  await deviceService.updateDevice(req.params.id, data.fcmToken);

  return sendSuccess(res);
}

async function claimDevice(req, res) {
  await deviceService.claimDevice(req.params.id, req.user.uid);
  return sendSuccess(res);
}

export default {
  createDevice,
  updateDevice,
  claimDevice,
};
