import mongoose from "mongoose";

import { getAuditLogsSchema } from "@shared/schemas";
import { sendBadRequestError, sendData } from "../utils/response.js";

import auditLogService from "../services/auditLogService.js";

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

  sendData(res, { auditLogs });
}

export default { getAuditLogs };
