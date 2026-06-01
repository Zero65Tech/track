import mongoose from "mongoose";
import { EntryType, EntryState, DataSource } from "@shared/enums";

const entrySchema = new mongoose.Schema(
  {
    _src: {
      type: String,
      enum: Object.values(DataSource),
      required: true,
    },

    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    date: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid date format !`,
      },
    },

    type: {
      type: String,
      enum: Object.values(EntryType).map((t) => t.id),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },

    breakdown: {
      type: [
        {
          _id: false,
          amount: { type: Number, required: true },
          note: { type: String, required: true },
        },
      ],
      required: false,
    },
    note: {
      type: String,
      required: false,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    sortOrder: {
      type: Number,
      required: true,
    },

    state: {
      type: String,
      enum: Object.values(EntryState).map((s) => s.id),
      required: true,
    },
  },
  {
    collection: "entries",
    discriminatorKey: "type",
    versionKey: false,
    timestamps: true,
  },
);

const bookEntrySchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  headId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Head",
    required: true,
  },
  tagId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tag",
    required: true,
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Source",
    default: null,
  },
});

const sourceEntrySchema = new mongoose.Schema({
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Source",
    required: true,
  },
});

const relocateEntrySchema = new mongoose.Schema({
  bookIdFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  bookIdTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
});

const transferEntrySchema = new mongoose.Schema({
  sourceIdFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Source",
    required: true,
  },
  sourceIdTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Source",
    required: true,
  },
});

entrySchema.discriminator(EntryType.INCOME.id, bookEntrySchema);
entrySchema.discriminator(EntryType.INCOME_TAX.id, bookEntrySchema);
entrySchema.discriminator(EntryType.INCOME_TAX_REFUND.id, bookEntrySchema);
entrySchema.discriminator(EntryType.EXPENSE.id, bookEntrySchema);
entrySchema.discriminator(EntryType.EXPENSE_REFUND.id, bookEntrySchema);
entrySchema.discriminator(EntryType.LOAN_GIVEN.id, bookEntrySchema);
entrySchema.discriminator(EntryType.LOAN_TAKEN.id, bookEntrySchema);
entrySchema.discriminator(EntryType.INVESTMENT_DEPOSIT.id, bookEntrySchema);
entrySchema.discriminator(EntryType.INVESTMENT_WITHDRAWAL.id, bookEntrySchema);
entrySchema.discriminator(EntryType.POSITION_ONBOARD.id, bookEntrySchema);
entrySchema.discriminator(EntryType.POSITION_OFFBOARD.id, bookEntrySchema);

entrySchema.discriminator(EntryType.RELOCATE.id, relocateEntrySchema);

entrySchema.discriminator(EntryType.PAYMENT.id, sourceEntrySchema);
entrySchema.discriminator(EntryType.RECEIPT.id, sourceEntrySchema);

entrySchema.discriminator(EntryType.TRANSFER.id, transferEntrySchema);

// TODO: Deprecate
entrySchema.discriminator(EntryType.CREDIT.id, bookEntrySchema);
entrySchema.discriminator(EntryType.DEBIT.id, bookEntrySchema);
entrySchema.discriminator(EntryType.REFUND.id, bookEntrySchema);
entrySchema.discriminator(EntryType.TAX.id, bookEntrySchema);

export default mongoose.model("Entry", entrySchema);
