import DeviceModel from "../models/Device.js";

async function _getActiveDeviceFcmTokens(...userIds) {
  const results = await DeviceModel.find({
    userId: { $in: userIds },
    active: true,
  }).lean();
  return results.map((result) => result.fcmToken);
}

async function createDevice(userId, fcmToken) {
  const doc = await DeviceModel.create({ userId, fcmToken, active: true });

  const data = doc.toObject();
  data.id = doc._id.toString();
  delete data._id;

  return data;
}

async function updateDevice(userId, deviceId, fcmToken) {
  await DeviceModel.updateOne({ userId, _id: deviceId }, { fcmToken });
}

export default { createDevice, updateDevice };

export { _getActiveDeviceFcmTokens };
