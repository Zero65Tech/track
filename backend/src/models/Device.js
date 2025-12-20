import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    fcmToken: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
  },
  {
    collection: "devices",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Device", deviceSchema);
