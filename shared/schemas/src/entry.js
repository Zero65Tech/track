import { EntryType } from "@shared/enums";
import { z } from "zod";
import {
  amountSchema,
  dateSchema,
  entryTypeSchema,
  mongoIdSchema,
  noteSchema,
  sortOrderSchema,
} from "./common.js";

// Entry type constants
const BOOK_ENTRY_TYPES = [
  EntryType.INCOME.id,
  EntryType.INCOME_TAX.id,
  EntryType.INCOME_TAX_REFUND.id,
  EntryType.EXPENSE.id,
  EntryType.EXPENSE_REFUND.id,
  EntryType.LOAN_GIVEN.id,
  EntryType.LOAN_TAKEN.id,
  EntryType.INVESTMENT_DEPOSIT.id,
  EntryType.INVESTMENT_WITHDRAWAL.id,
  EntryType.POSITION_ONBOARD.id,
  EntryType.POSITION_OFFBOARD.id,

  // TODO: Deprecate
  EntryType.CREDIT.id,
  EntryType.DEBIT.id,
  EntryType.TAX.id,
  EntryType.REFUND.id,
];

const SOURCE_ENTRY_TYPES = [EntryType.PAYMENT.id, EntryType.RECEIPT.id];

// Base schema shared by both create and update
const baseEntrySchema = z
  .object({
    date: dateSchema,
    type: entryTypeSchema,
    amount: amountSchema,
    bookId: mongoIdSchema.optional(),
    headId: mongoIdSchema.optional(),
    tagId: mongoIdSchema.optional(),
    sourceId: mongoIdSchema.optional(),
    bookIdFrom: mongoIdSchema.optional(),
    bookIdTo: mongoIdSchema.optional(),
    sourceIdFrom: mongoIdSchema.optional(),
    sourceIdTo: mongoIdSchema.optional(),
    note: noteSchema.optional(),
    groupId: mongoIdSchema.optional(),
    folderId: mongoIdSchema.optional(),
    sortOrder: sortOrderSchema,
  })
  .strict();

export const createEntrySchema = baseEntrySchema.refine(
  (data) => {
    if (BOOK_ENTRY_TYPES.includes(data.type)) {
      return data.bookId && data.headId && data.tagId;
    }

    if (SOURCE_ENTRY_TYPES.includes(data.type)) {
      return data.bookId && data.sourceId;
    }

    if (data.type === EntryType.RELOCATE.id) {
      return data.bookIdFrom && data.bookIdTo;
    }

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
  },
);

export const updateEntrySchema = baseEntrySchema
  .partial()
  .refine(
    (data) =>
      Object.keys(data).length > 0 &&
      Object.values(data).some((val) => val !== undefined),
    {
      message: "At least one field must be provided for update",
      path: [],
    },
  )
  .refine(
    (data) => {
      // Prevent nullifying required fields for book entry types
      if (BOOK_ENTRY_TYPES.includes(data.type)) {
        if (
          data.bookId === null ||
          data.headId === null ||
          data.tagId === null
        ) {
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
    },
  );
