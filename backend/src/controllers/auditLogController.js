import { getAuditLogsSchema } from "@shared/schemas";
import { sendData, sendBadRequestError } from "../utils/response.js";
import auditLogService from "../services/auditLogService.js";

async function getAuditLogs(req, res) {
  const { success, error, data } = getAuditLogsSchema.safeParse(req.query);
  if (!success) {
    return sendBadRequestError(res, error);
  }

  const auditLogs = await auditLogService.getAuditLogs(
    req.params.profileId,
    data.lastTimestamp,
    data.pageSize,
  );

  sendData(res, {
    auditLogs,
    lastTimestamp: auditLogs.length
      ? auditLogs[auditLogs.length - 1].timestamp
      : null,
  });
}

export default { getAuditLogs };
