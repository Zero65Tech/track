import { z } from "zod";
import { mongoIdSchema, timeStampSchema, pageSizeSchema } from "./common.js";

export const getTriggersSchema = z
  .object({
    lastCreatedAt: timeStampSchema.optional(),
    pageSize: pageSizeSchema.optional(),
  })
  .strict();

export const createDataAggregationTriggerSchema = z
  .object({
    aggregationName: z.string().trim().min(1, "'aggregationName' is required"),
    entryType: entryTypeSchema.optional(),
    bookId: mongoIdSchema.optional(),
    headId: mongoIdSchema.optional(),
    tagId: mongoIdSchema.optional(),
    sourceId: mongoIdSchema.optional(),
  })
  .strict();
