import mongoose from "mongoose";
import { AttributeState, DataSource } from "@shared/enums";

const tagSchema = new mongoose.Schema(
  {
    _src: {
      type: String,
      enum: Object.values(DataSource),
      required: true,
    },
    _ref: {
      type: String,
      required: false,
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

    sortOrder: {
      type: Number,
      required: true,
    },

    state: {
      type: String,
      enum: Object.values(AttributeState).map((s) => s.id),
      required: true,
    },
  },
  {
    collection: "tags",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Tag", tagSchema);
