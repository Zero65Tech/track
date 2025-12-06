import AuditLogModel from "../models/AuditLog.js";
import userService from "./userService.js";

async function getAll(profileId, lastTimestamp, pageSize = 10) {
  const query = { profileId };
  if (lastTimestamp) {
    query.timestamp = { $lt: new Date(lastTimestamp) };
  }

  const dataArr = await AuditLogModel.find(query)
    .sort({ timestamp: -1 })
    .limit(pageSize)
    .lean();

  for (let data of dataArr) {
    const userData = await userService._getCached(data.userId);
    delete data["userId"];
    data["userName"] =
      userData.displayName || userData.phoneNumber || userData.email;
  }

  return dataArr;
}

async function _logCreate({ userId, docType, data }, session) {
  const { _id, profileId, ...dataAfter } = data;

  await AuditLogModel.create(
    [
      {
        userId,
        profileId: profileId || _id,
        event: "create",
        docType,
        docId: _id,
        dataBefore: null,
        dataAfter,
      },
    ],
    { session },
  );
}

async function _logUpdate({ userId, docType, oldData, newData }, session) {
  const { _id, profileId, ...dataBefore } = oldData;

  const dataAfter = { ...newData };
  delete dataAfter._id;
  delete dataAfter.profileId;

  await AuditLogModel.create(
    [
      {
        userId,
        profileId: profileId || _id,
        event: "update",
        docType,
        docId: _id,
        dataBefore,
        dataAfter,
      },
    ],
    { session },
  );
}

async function _logDelete({ userId, docType, data }, session) {
  const { _id, profileId, ...dataBefore } = data;

  await AuditLogModel.create(
    [
      {
        userId,
        profileId: profileId || _id,
        event: "delete",
        docType,
        docId: _id,
        dataBefore,
        dataAfter: null,
      },
    ],
    { session },
  );
}

export default { getAll, _logCreate, _logUpdate, _logDelete };
