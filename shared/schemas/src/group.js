import { z } from "zod";
import { mongoIdSchema, nameSchema } from "./common.js";

export const createGroupSchema = z
  .object({
    name: nameSchema.optional(),
    folderId: mongoIdSchema.optional(),
  })
  .strict();

export const updateGroupSchema = z
  .object({
    name: nameSchema.optional(),
    starred: z.boolean().optional(),
    folderIds: z.array(mongoIdSchema).optional(),
  })
  .strict()
  .refine(
    (data) =>
      Object.keys(data).length > 0 &&
      Object.values(data).some((val) => val !== undefined),
    {
      message: "At least one field must be provided for update",
      path: [],
    },
  );
