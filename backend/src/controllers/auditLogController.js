import { sendData } from "../utils/response.js";
import auditLogService from "../services/auditLogService.js";

async function getAll(req, res) {
  const auditLogs = await auditLogService.getAll(
    req.params.profileId,
    req.query.lastTimestamp,
    req.query.pageSize,
  );
  sendData(res, {
    auditLogs,
    lastTimestamp: auditLogs.length
      ? auditLogs[auditLogs.length - 1].timestamp
      : null,
  });
}

export default { getAll };
