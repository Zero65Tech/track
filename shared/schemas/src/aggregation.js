import { z } from "zod";
import { entryTypeSchema, mongoIdSchema } from "./common.js";

export const getAggregationResultSchema = z
  .object({
    entryType: entryTypeSchema.optional(),
    bookId: mongoIdSchema.optional(),
    headId: mongoIdSchema.optional(),
    tagId: mongoIdSchema.optional(),
    sourceId: mongoIdSchema.optional(),
  })
  .strict();
