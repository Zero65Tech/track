import { z } from "zod";
import { mongoIdSchema, nameSchema, sortOrderSchema } from "./common.js";

export const createFolderSchema = z
  .object({
    parentId: mongoIdSchema.optional(),
    name: nameSchema,
    sortOrder: sortOrderSchema,
  })
  .strict();

export const updateFolderSchema = z
  .object({
    parentId: mongoIdSchema.optional(),
    name: nameSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
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
