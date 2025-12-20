import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
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

deviceSchema.index({ userId: 1 });

export default mongoose.model("Device", deviceSchema);
