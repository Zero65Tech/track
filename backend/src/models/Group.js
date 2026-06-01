import mongoose from "mongoose";
import { DataSource } from "@shared/enums";

const groupSchema = new mongoose.Schema(
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
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    starred: {
      type: Boolean,
      default: false,
    },

    folderIds: {
      type: [String],
      default: [],
    },
  },
  {
    collection: "groups",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Group", groupSchema);
