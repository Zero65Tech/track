import { z } from "zod";

export const createCustomAggregationSchema = z.object({
  pipeline: z.array(z.record(z.any())).min(1, "Pipeline must contain at least one stage"),
  name: z.string().trim().min(1, "'name' is required").optional(),
}).strict();

