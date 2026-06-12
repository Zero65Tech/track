import { z } from "zod";

export const getAuditLogsSchema = z
  .object({
    lastTimestamp: timeStampSchema.optional(), // yyyy-MM-ddTHH:mm:ssZ
    pageSize: pageSizeSchema.optional(),
  })
  .strict();
