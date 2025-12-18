import mongoose from "mongoose";
import { AggregationName } from "@shared/enums";

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

    result: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    collection: "aggregations",
    discriminatorKey: "name",
    versionKey: false,
    timestamps: true,
  },
);

aggregationSchema.discriminator(
  AggregationName.CUSTOM.id,
  new mongoose.Schema({
    pipeline: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  }),
);

export default mongoose.model("Aggregation", aggregationSchema);
