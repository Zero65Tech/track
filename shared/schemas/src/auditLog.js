import { z } from "zod";

export const getAuditLogsSchema = z
  .object({
    lastTimestamp: z.string().datetime().pipe(z.coerce.date()).optional(), // yyyy-MM-ddTHH:mm:ssZ
    pageSize: z.coerce.number().int().positive().optional(),
  })
  .strict();
