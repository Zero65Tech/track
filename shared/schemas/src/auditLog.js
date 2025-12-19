import { z } from "zod";

const mongoIdString = z.string().trim().regex(/^[a-f0-9]{24}$/, "Invalid MongoDB ID format");

export const getAuditLogsSchema = z.object({
  lastTimestamp: z.number().int().optional(),
  pageSize: z.number().int().positive("'pageSize' must be a positive number").optional(),
}).strict();
