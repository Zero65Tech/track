import DeviceModel from "../models/Device.js";

async function _getActiveDeviceFcmTokens(...userIds) {
  const results = await DeviceModel.find({
    userId: { $in: userIds },
    active: true,
  }).lean();
  return results.map((result) => result.fcmToken);
}

async function createDevice(fcmToken) {
  const doc = await DeviceModel.create({ fcmToken, active: true });

  const data = doc.toObject();
  data.id = doc._id.toString();
  delete data._id;

  return data;
}

async function updateDevice(deviceId, fcmToken) {
  await DeviceModel.updateOne({ _id: deviceId }, { fcmToken });
}

async function claimDevice(deviceId, userId) {
  await DeviceModel.updateOne({ _id: deviceId }, { userId });
}

export default { createDevice, updateDevice, claimDevice };

export { _getActiveDeviceFcmTokens };
