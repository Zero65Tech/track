import { z } from "zod";
import { pageSizeSchema, timeStampSchema } from "./common.js";

export const getAuditLogsSchema = z
  .object({
    lastTimestamp: timeStampSchema.optional(), // yyyy-MM-ddTHH:mm:ssZ
    pageSize: pageSizeSchema.optional(),
  })
  .strict();
