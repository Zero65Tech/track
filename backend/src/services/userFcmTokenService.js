import UserFcmTokenModel from "../models/UserFcmToken.js";

async function storeFcmToken(userId, deviceId, fcmToken) {
  if (!userId || !deviceId || !fcmToken) {
    throw new Error("userId, deviceId, and fcmToken are required");
  }

  await UserFcmTokenModel.updateOne(
    { userId, deviceId },
    { userId, deviceId, fcmToken },
    { upsert: true },
  );
}

async function getFcmTokens(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  const results = await UserFcmTokenModel.find({ userId }).lean();
  return results.map((result) => result.fcmToken);
}

async function deleteFcmToken(userId, deviceId) {
  if (!userId || !deviceId) {
    throw new Error("userId and deviceId are required");
  }

  return await UserFcmTokenModel.deleteOne({ userId, deviceId });
}

export default { storeFcmToken, getFcmTokens, deleteFcmToken };
