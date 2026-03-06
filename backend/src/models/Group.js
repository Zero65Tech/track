import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    name: {
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
