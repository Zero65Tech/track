import { z } from "zod";

export const createDataAggregationTriggerSchema = z.object({
  aggregationName: z.string().trim().min(1, "'aggregationName' is required"),
  type: z.string().trim().optional(),
  bookId: z.string().trim().optional(),
  headId: z.string().trim().optional(),
  tagId: z.string().trim().optional(),
  sourceId: z.string().trim().optional(),
}).strict();
