import mongoose from "mongoose";

const userFcmTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
    },
    fmcToken: {
      type: String,
      required: true,
    },
  },
  {
    collection: "user_fcm_tokens",
    versionKey: false,
    timestamps: true,
  },
);

userFcmTokenSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export default mongoose.model("UserFcmToken", userFcmTokenSchema);
