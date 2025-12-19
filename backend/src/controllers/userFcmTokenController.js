import { storeFcmTokenSchema } from "@shared/schemas";
import { sendSuccess, sendBadRequestError } from "../utils/response.js";
import userFcmTokenService from "../services/userFcmTokenService.js";

async function storeFcmToken(req, res) {
  const { success, error, data } = storeFcmTokenSchema.safeParse(req.body);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  await userFcmTokenService.storeFcmToken(
    req.user.uid,
    data.deviceId,
    data.fcmToken,
  );

  return sendSuccess(res);
}

export default { storeFcmToken };
