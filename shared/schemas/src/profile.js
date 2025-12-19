import { z } from "zod";
import { ProfileState } from "@shared/enums";

const profileNameSchema = z
  .string()
  .trim()
  .min(1, "'name' is required")
  .max(255, "'name' cannot exceed 255 characters");

const profileStateEnum = Object.values(ProfileState).map(state => state.id);

export const createProfileSchema = z.object({
  name: profileNameSchema,
}).strict();

export const updateProfileSchema = z.object({
  name: profileNameSchema.optional(),
  state: z.string().trim().pipe(z.enum(profileStateEnum)).optional(),
}).strict().refine(
  (data) => data.name !== undefined || data.state !== undefined,
  {
    message: "At least one of 'name' or 'state' must be provided",
    path: [],
  }
);
