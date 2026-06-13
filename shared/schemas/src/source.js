import { z } from "zod";
import {
  descriptionSchema,
  entryStateSchema,
  nameSchema,
  sortOrderSchema,
} from "./common.js";

export const createSourceSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema.optional(),
    group: nameSchema.optional(),
    sortOrder: sortOrderSchema,
  })
  .strict();

export const updateSourceSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    group: nameSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
    state: entryStateSchema.optional(),
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
