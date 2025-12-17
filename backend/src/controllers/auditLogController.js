import { sendData } from "../utils/response.js";
import { getAll as getAllAuditLogs } from "../services/auditLogService.js";

async function getAll(req, res) {
  const auditLogs = await getAllAuditLogs(
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
