import { createDeviceSchema, updateDeviceSchema } from "@shared/schemas";
import deviceService from "../services/deviceService.js";
import {
  sendBadRequestError,
  sendData,
  sendSuccess,
} from "../utils/response.js";

async function createDevice(req, res) {
  const { success, error, data } = createDeviceSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  const device = await deviceService.createDevice(data.fcmToken);

  device.id = device._id.toString();
  delete device._id;

  return sendData(res, { device });
}

async function updateDevice(req, res) {
  const { success, error, data } = updateDeviceSchema.safeParse(req.body);

  if (!success) return sendBadRequestError(res, error);

  await deviceService.updateDevice(req.params.deviceId, data.fcmToken);

  return sendSuccess(res);
}

async function claimDevice(req, res) {
  await deviceService.claimDevice(req.params.deviceId, req.user.uid);
  return sendSuccess(res);
}

export default {
  createDevice,
  updateDevice,
  claimDevice,
};
