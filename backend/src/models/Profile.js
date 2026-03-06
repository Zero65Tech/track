import mongoose from "mongoose";
import { ProfileState } from "@shared/enums";

const profileSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      match: /^(system|[a-zA-Z0-9]{28})$/,
    },
    editors: {
      type: [String],
      default: [],
      match: /^([a-zA-Z0-9]{28})$/,
    },
    viewers: {
      type: [String],
      default: [],
      match: /^([a-zA-Z0-9]{28})$/,
    },

    name: {
      type: String,
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
