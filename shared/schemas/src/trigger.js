import { z } from "zod";
import {
  entryTypeSchema,
  mongoIdSchema,
  nameSchema,
  pageSizeSchema,
  timeStampSchema,
} from "./common.js";

export const getTriggersSchema = z
  .object({
    lastCreatedAt: timeStampSchema.optional(),
    pageSize: pageSizeSchema.optional(),
  })
  .strict();

export const createDataAggregationTriggerSchema = z
  .object({
    aggregationName: nameSchema,
    entryType: entryTypeSchema.optional(),
    bookId: mongoIdSchema.optional(),
    headId: mongoIdSchema.optional(),
    tagId: mongoIdSchema.optional(),
    sourceId: mongoIdSchema.optional(),
  })
  .strict();

export const processTriggersSchema = z
  .object({
    limit: pageSizeSchema.optional(),
  })
  .strict();
