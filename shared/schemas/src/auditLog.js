import { z } from "zod";
import { timeStampSchema, pageSizeSchema } from "./common.js";

export const getAuditLogsSchema = z
  .object({
    lastTimestamp: timeStampSchema.optional(), // yyyy-MM-ddTHH:mm:ssZ
    pageSize: pageSizeSchema.optional(),
  })
  .strict();
