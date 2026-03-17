import mongoose from "mongoose";
import { EntryType } from "@shared/enums";

const aggregationParamsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(EntryType).map((t) => t.id),
      required: false,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: false,
    },
    headId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Head",
      required: false,
    },
    tagId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
      required: false,
    },
  },
  { _id: false },
);

export default aggregationParamsSchema;
