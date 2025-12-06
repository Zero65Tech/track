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
    },
    starred: {
      type: Boolean,
    },

    folderIds: {
      type: [String],
    },
  },
  {
    collection: "groups",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Group", groupSchema);
