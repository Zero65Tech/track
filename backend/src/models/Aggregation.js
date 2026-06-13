import mongoose from "mongoose";
import aggregationParamsSchema from "./schemas/aggregationParams.js";

const aggregationSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    params: {
      type: aggregationParamsSchema,
      required: true,
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    collection: "aggregations",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Aggregation", aggregationSchema);
