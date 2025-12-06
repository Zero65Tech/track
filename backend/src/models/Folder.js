import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
    },

    name: {
      type: String,
      required: true,
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
