import { z } from "zod";

const folderNameSchema = z
  .string()
  .trim()
  .min(1, "'name' is required")
  .max(255, "'name' cannot exceed 255 characters");

const folderParentIdSchema = z
  .string()
  .trim()
  .min(1, "'parentId' must be a valid ObjectId string");

const folderSortOrderSchema = z
  .number()
  .int("'sortOrder' must be an integer")
  .min(0, "'sortOrder' must be non-negative");

export const createFolderSchema = z.object({
  parentId: folderParentIdSchema.optional(),
  name: folderNameSchema,
  sortOrder: folderSortOrderSchema,
}).strict();

export const updateFolderSchema = z.object({
  parentId: folderParentIdSchema.optional(),
  name: folderNameSchema.optional(),
  sortOrder: folderSortOrderSchema.optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0 && Object.values(data).some(val => val !== undefined),
  {
    message: "At least one field must be provided for update",
    path: [],
  }
);
