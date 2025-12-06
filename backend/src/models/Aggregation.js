import mongoose from "mongoose";
import { AggregationName } from "@zero65/track";

const aggregationSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    name: {
      type: String,
      enum: Object.values(AggregationName).map((n) => n.id),
      required: true,
    },

    pipeline: {
      // TODO
      type: mongoose.Schema.Types.Mixed,
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    collection: "aggregations",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Aggregation", aggregationSchema);
