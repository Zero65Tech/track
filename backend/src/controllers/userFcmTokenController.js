import { sendData, sendBadRequestError } from "../utils/response.js";
import userFcmTokenService from "../services/userFcmTokenService.js";

async function storeFcmToken(req, res) {
  const { deviceId, fmcToken } = req.body;
  const userId = req.user.uid;

  if (!fmcToken) {
    return sendBadRequestError(res, "'fmcToken' is required");
  }

  if (!deviceId) {
    return sendBadRequestError(res, "'deviceId' is required");
  }

  await userFcmTokenService.storeFcmToken(userId, deviceId, fmcToken);

  return sendData(res);
}

export default { storeFcmToken };
