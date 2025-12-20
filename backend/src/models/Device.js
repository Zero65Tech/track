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
  },
  {
    collection: "devices",
    versionKey: false,
    timestamps: true,
  },
);

deviceSchema.index({ userId: 1 });

export default mongoose.model("Device", deviceSchema);
