import mongoose from "mongoose";
import { ProfileState } from "@zero65/track";

const profileSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
    },
    editors: {
      type: [String],
      default: undefined,
    },
    viewers: {
      type: [String],
      default: undefined,
    },

    name: {
      type: String,
      required: true,
    },

    coins: {
      type: Number,
      default: 0,
      required: true,
    },

    state: {
      type: String,
      enum: Object.values(ProfileState).map((s) => s.id),
      required: true,
    },
  },
  {
    collection: "profiles",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Profile", profileSchema);
