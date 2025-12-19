import { z } from "zod";
import { EntryType } from "@shared/enums";

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "'date' must be in YYYY-MM-DD format");

const amountSchema = z
  .number()
  .finite("'amount' must be a finite number");

const noteSchema = z
  .string()
  .trim()
  .max(1000, "'note' cannot exceed 1000 characters")
  .optional()
  .nullable();

const sortOrderSchema = z
  .number()
  .int("'sortOrder' must be an integer")
  .min(0, "'sortOrder' must be non-negative");

const mongoIdSchema = z.string().regex(/^[0-9a-f]{24}$/i, "Invalid ObjectId format");

const optionalMongoIdSchema = mongoIdSchema.optional().nullable();

const requiredMongoIdSchema = mongoIdSchema;

// Entry type constants
const BOOK_ENTRY_TYPES = [
  EntryType.CREDIT.id,
  EntryType.DEBIT.id,
  EntryType.INCOME.id,
  EntryType.EXPENSE.id,
  EntryType.REFUND.id,
  EntryType.TAX.id,
];

const SOURCE_ENTRY_TYPES = [EntryType.PAYMENT.id, EntryType.RECEIPT.id];

// Base schema shared by both create and update
const baseEntrySchema = z.object({
  date: dateSchema,
  type: z.string().trim().pipe(z.enum(Object.values(EntryType).map((t) => t.id))),
  amount: amountSchema,
  bookId: optionalMongoIdSchema,
  headId: optionalMongoIdSchema,
  tagId: optionalMongoIdSchema,
  sourceId: optionalMongoIdSchema,
  bookIdFrom: optionalMongoIdSchema,
  bookIdTo: optionalMongoIdSchema,
  sourceIdFrom: optionalMongoIdSchema,
  sourceIdTo: optionalMongoIdSchema,
  note: noteSchema,
  folderId: optionalMongoIdSchema,
  groupId: optionalMongoIdSchema,
  sortOrder: sortOrderSchema,
}).strict();

export const createEntrySchema = baseEntrySchema.refine(
  (data) => {
    // Book entry types (credit, debit, income, expense, refund, tax)
    if (BOOK_ENTRY_TYPES.includes(data.type)) {
      return data.bookId && data.headId && data.tagId;
    }

    // Source entry types (payment, receipt)
    if (SOURCE_ENTRY_TYPES.includes(data.type)) {
      return data.bookId && data.sourceId;
    }

    // Relocate entry type
    if (data.type === EntryType.RELOCATE.id) {
      return data.bookIdFrom && data.bookIdTo;
    }

    // Transfer entry type
    if (data.type === EntryType.TRANSFER.id) {
      return data.sourceIdFrom && data.sourceIdTo;
    }

    return true;
  },
  {
    message:
      "Missing required fields for the selected entry type. " +
      "Book entries (credit/debit/income/expense/refund/tax) require: bookId, headId, tagId. " +
      "Source entries (payment/receipt) require: bookId, sourceId. " +
      "Relocate requires: bookIdFrom, bookIdTo. " +
      "Transfer requires: sourceIdFrom, sourceIdTo.",
    path: ["type"],
  }
);

export const updateEntrySchema = baseEntrySchema.partial().refine(
  (data) => Object.keys(data).length > 0 && Object.values(data).some(val => val !== undefined),
  {
    message: "At least one field must be provided for update",
    path: [],
  }
).refine(
  (data) => {
    // Prevent nullifying required fields for book entry types
    if (BOOK_ENTRY_TYPES.includes(data.type)) {
      if (data.bookId === null || data.headId === null || data.tagId === null) {
        return false;
      }
    }

    // Prevent nullifying required fields for source entry types
    if (SOURCE_ENTRY_TYPES.includes(data.type)) {
      if (data.bookId === null || data.sourceId === null) {
        return false;
      }
    }

    // Prevent nullifying required fields for relocate entry type
    if (data.type === EntryType.RELOCATE.id) {
      if (data.bookIdFrom === null || data.bookIdTo === null) {
        return false;
      }
    }

    // Prevent nullifying required fields for transfer entry type
    if (data.type === EntryType.TRANSFER.id) {
      if (data.sourceIdFrom === null || data.sourceIdTo === null) {
        return false;
      }
    }

    return true;
  },
  {
    message:
      "Cannot set required fields to null. " +
      "Book entries require: bookId, headId, tagId. " +
      "Source entries require: bookId, sourceId. " +
      "Relocate requires: bookIdFrom, bookIdTo. " +
      "Transfer requires: sourceIdFrom, sourceIdTo.",
    path: ["type"],
  }
);
