import { EntryState, EntryType, ProfileState } from "@shared/enums";
import { z } from "zod";

// IDs

export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-f]{24}$/, "Invalid ObjectId");

export const fcmTokenSchema = z.string().trim().min(1, "Required"); // TODO:  improvise

export const colorHexSchema = z
  .string()
  .regex(/^#[0-9A-F]{6}$/, "Must be in #dddddd format");

// Enums

const profileStateEnum = Object.values(ProfileState).map((state) => state.id);
export const profileStateSchema = z.string().pipe(z.enum(profileStateEnum));

const entryTypeEnum = Object.values(EntryType).map((type) => type.id);
export const entryTypeSchema = z.string().pipe(z.enum(entryTypeEnum));

const entryStateEnum = Object.values(EntryState).map((state) => state.id);
export const entryStateSchema = z.string().pipe(z.enum(entryStateEnum));

// Others

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format");

export const timeStampSchema = z.string().datetime(); // yyyy-MM-ddTHH:mm:ssZ

export const amountSchema = z.number().finite("Must be a finite number");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(255, "Cannot exceed 255 characters");

export const descriptionSchema = z
  .string()
  .trim()
  .max(1000, "Cannot exceed 1000 characters");

export const noteSchema = z
  .string()
  .trim()
  .max(1000, "Cannot exceed 1000 characters");

export const sortOrderSchema = z
  .number()
  .int("Must be an integer")
  .min(0, "Must be non-negative");

export const pageSizeSchema = z.coerce.number().int().positive();
