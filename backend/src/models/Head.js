import mongoose from "mongoose";
import { EntryFieldState, DataSource } from "@shared/enums";

const headSchema = new mongoose.Schema(
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

    group: {
      type: String,
      default: null,
    },
    assessee: {
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
    collection: "heads",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Head", headSchema);
