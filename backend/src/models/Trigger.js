import mongoose from "mongoose";
import { TriggerType, TriggerState } from "@zero65/track";

const triggerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    type: {
      type: String,
      enum: Object.values(TriggerType).map((t) => t.id),
      required: true,
    },

    state: {
      type: String,
      enum: Object.values(TriggerState).map((s) => s.id),
      required: false,
    },
  },
  {
    collection: "triggers",
    discriminatorKey: "type",
    versionKey: false,
    timestamps: true,
  },
);

triggerSchema.discriminator(
  TriggerType.DATA_AGGREGATION.id,
  new mongoose.Schema({
    params: {
      name: {
        type: String,
        required: true,
      },
    },
    result: {
      message: {
        type: String,
      },
    },
  }),
);

export default mongoose.model("Trigger", triggerSchema);
