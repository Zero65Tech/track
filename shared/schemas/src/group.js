import { z } from "zod";

const groupNameSchema = z
  .string()
  .trim()
  .min(1, "'name' is required")
  .max(255, "'name' cannot exceed 255 characters");

const groupStarredSchema = z.boolean().optional();

const groupFolderIdsSchema = z
  .array(z.string().trim().min(1, "Folder IDs must be valid strings"))
  .optional();

export const createGroupSchema = z.object({
  name: groupNameSchema.optional(),
  starred: groupStarredSchema.optional(),
  folderIds: groupFolderIdsSchema.optional(),
}).strict();

export const updateGroupSchema = z.object({
  name: groupNameSchema.optional(),
  starred: groupStarredSchema.optional(),
  folderIds: groupFolderIdsSchema.optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0 && Object.values(data).some(val => val !== undefined),
  {
    message: "At least one field must be provided for update",
    path: [],
  }
);
