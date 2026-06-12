import { getAuditLogsSchema } from "@shared/schemas";
import { sendData, sendBadRequestError } from "../utils/response.js";
import auditLogService from "../services/auditLogService.js";
import mongoose from "mongoose";

async function getAuditLogs(req, res) {
  const { success, error, data } = getAuditLogsSchema.safeParse(req.query);

  if (!success) return sendBadRequestError(res, error);

  const auditLogs = await auditLogService.getAuditLogs(
    new mongoose.Types.ObjectId(req.params.profileId),
    data.lastTimestamp ? new Date(data.lastTimestamp) : null,
    data.pageSize || 20,
  );

  for (const auditLog of auditLogs) {
    auditLog.id = auditLog._id.toString();
    delete auditLog._id;
  }

  const lastTimestamp = auditLogs.length
    ? auditLogs[auditLogs.length - 1].timestamp
    : null;

  sendData(res, { auditLogs, lastTimestamp });
}

export default { getAuditLogs };
