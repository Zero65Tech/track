import { storeFcmTokenSchema } from "@shared/schemas";
import { sendSuccess, sendBadRequestError } from "../utils/response.js";
import userFcmTokenService from "../services/userFcmTokenService.js";

async function storeFcmToken(req, res) {
  const userId = req.user.uid;

  const { success, error, data } = storeFcmTokenSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  await userFcmTokenService.storeFcmToken(userId, data.deviceId, data.fcmToken);

  return sendSuccess(res);
}

export default { storeFcmToken };
