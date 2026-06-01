import mongoose from "mongoose";
import { EntryFieldState, EntrySource } from "@shared/enums";

const bookSchema = new mongoose.Schema(
  {
    _src: {
      type: String,
      enum: Object.values(EntrySource),
      required: true,
    },

    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },

    icon: {
      type: String,
      default: null,
    },
    color: {
      type: String,
      default: null,
    },

    sortOrder: {
      type: Number,
      required: true,
    },

    state: {
      type: String,
      enum: Object.values(EntryFieldState).map((s) => s.id),
      required: true,
    },
  },
  {
    collection: "books",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Book", bookSchema);
