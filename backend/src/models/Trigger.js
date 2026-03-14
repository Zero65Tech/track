import mongoose from "mongoose";
import { TriggerType, TriggerState } from "@shared/enums";

const triggerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      match: /^(system|[a-zA-Z0-9]{28})$/,
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
      required: true,
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
      aggregationName: {
        type: String,
        required: true,
      },
      type: { type: String, default: null },
      bookId: { type: String, default: null },
      headId: { type: String, default: null },
      tagId: { type: String, default: null },
    },
    result: {
      message: {
        type: String,
        default: null,
      },
    },
  }),
);

export default mongoose.model("Trigger", triggerSchema);
