import { z } from "zod";
import { EntryFieldState } from "@shared/enums";

const nameSchema = z
  .string()
  .trim()
  .min(1, "'name' is required")
  .max(255, "'name' cannot exceed 255 characters");

const descriptionSchema = z
  .string()
  .trim()
  .min(1, "'description' is required")
  .max(500, "'description' cannot exceed 500 characters");

const iconSchema = z
  .string()
  .trim()
  .min(1, "'icon' is required")
  .max(100, "'icon' cannot exceed 100 characters");

const colorSchema = z
  .string()
  .trim()
  .min(1, "'color' is required")
  .max(50, "'color' cannot exceed 50 characters");

const groupSchema = z
  .string()
  .trim()
  .min(1, "'group' is required")
  .max(100, "'group' cannot exceed 100 characters");

const sortOrderSchema = z
  .number()
  .int("'sortOrder' must be an integer")
  .min(0, "'sortOrder' must be non-negative");

const stateEnum = Object.values(EntryFieldState).map(state => state.id);

// Base schema for create operations
const createBaseSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
  icon: iconSchema,
  color: colorSchema,
  sortOrder: sortOrderSchema,
}).strict();

// Schema for Book (no group field)
export const createBookSchema = createBaseSchema;

// Schema for Head, Tag, Source (with group field)
export const createHeadSchema = createBaseSchema.extend({
  group: groupSchema.optional(),
});

export const createTagSchema = createBaseSchema.extend({
  group: groupSchema.optional(),
});

export const createSourceSchema = createBaseSchema.extend({
  group: groupSchema.optional(),
});

// Update schemas
const updateBaseSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),
  icon: iconSchema.optional(),
  color: colorSchema.optional(),
  sortOrder: sortOrderSchema.optional(),
  state: z.string().trim().pipe(z.enum(stateEnum)).optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0 && Object.values(data).some(val => val !== undefined),
  {
    message: "At least one field must be provided for update",
    path: [],
  }
);

export const updateBookSchema = updateBaseSchema;

export const updateHeadSchema = updateBaseSchema.extend({
  group: groupSchema.optional(),
});

export const updateTagSchema = updateBaseSchema.extend({
  group: groupSchema.optional(),
});

export const updateSourceSchema = updateBaseSchema.extend({
  group: groupSchema.optional(),
});
