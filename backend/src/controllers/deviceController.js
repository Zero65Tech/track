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

  const device = await deviceService.createDevice(req.user.uid, data.fcmToken);

  return sendData(res, device);
}

async function updateDevice(req, res) {
  const { success, error, data } = updateDeviceSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  await deviceService.updateDevice(req.user.uid, req.params.id, data.fcmToken);

  return sendSuccess(res);
}

export default {
  createDevice,
  updateDevice,
};
