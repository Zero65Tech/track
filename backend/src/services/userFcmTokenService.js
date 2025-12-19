import UserFcmTokenModel from "../models/UserFcmToken.js";

async function storeFcmToken(userId, deviceId, fcmToken) {
  await UserFcmTokenModel.updateOne(
    { userId, deviceId },
    { fcmToken },
    { upsert: true },
  );
}

async function _getFcmTokens(...userIds) {
  const results = await UserFcmTokenModel.find({
    userId: { $in: userIds },
  }).lean();
  return results.map((result) => result.fcmToken);
}

async function deleteFcmToken(userId, deviceId) {
  await UserFcmTokenModel.deleteOne({ userId, deviceId });
}

export { _getFcmTokens, deleteFcmToken };

export default { storeFcmToken };
