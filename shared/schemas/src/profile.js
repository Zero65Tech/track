import { z } from "zod";
import { nameSchema, profileStateSchema } from "./common.js";

export const createProfileSchema = z
  .object({
    name: nameSchema,
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    state: profileStateSchema.optional(),
  })
  .strict()
  .refine((data) => data.name !== undefined || data.state !== undefined, {
    message: "At least one of 'name' or 'state' must be provided",
    path: [],
  });
