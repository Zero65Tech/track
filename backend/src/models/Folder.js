import mongoose from "mongoose";
import { DataSource } from "@shared/enums";

const folderSchema = new mongoose.Schema(
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

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },

    sortOrder: {
      type: Number,
      required: true,
    },
  },
  {
    collection: "folders",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Folder", folderSchema);
