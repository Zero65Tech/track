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
  await DeviceModel.updateOne({ _id: deviceId }, { fcmToken, active: true });
}

async function claimDevice(deviceId, userId) {
  await DeviceModel.updateOne({ _id: deviceId }, { userId });
}

async function _deactivateDevicesByFcmToken(fcmToken) {
  await DeviceModel.updateMany({ fcmToken }, { active: false });
}

export default { createDevice, updateDevice, claimDevice };

export { _getActiveDeviceFcmTokens, _deactivateDevicesByFcmToken };
