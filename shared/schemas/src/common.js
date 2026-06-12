import { z } from "zod";
import mongoose from "mongoose";

export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-f]{24}$/, "Invalid ObjectId");

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format");

const entryTypeEnum = Object.values(EntryType).map((state) => state.id);
export const entryTypeSchema = z.string().pipe(z.enum(entryTypeEnum));

export const amountSchema = z.number().finite("Must be a finite number");

export const noteSchema = z
  .string()
  .trim()
  .max(1000, "Cannot exceed 1000 characters");

export const sortOrderSchema = z
  .number()
  .int("Must be an integer")
  .min(0, "Must be non-negative");

export const timeStampSchema = z.string().datetime(); // yyyy-MM-ddTHH:mm:ssZ

export const pageSizeSchema = z.coerce.number().int().positive();
