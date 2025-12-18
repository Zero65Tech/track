import { z } from "zod";

export const profileNameSchema = z
  .string()
  .min(1, "'name' is required")
  .max(255, "'name' cannot exceed 255 characters");

export const createProfileSchema = z.object({
  name: profileNameSchema,
});

export const updateProfileSchema = z.object({
  name: profileNameSchema.optional(),
});
