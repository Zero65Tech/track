import { z } from "zod";

export const createDataAggregationTriggerSchema = z.object({
  aggregationName: z.string().trim().min(1, "'aggregationName' is required"),
}).strict();
