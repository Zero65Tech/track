import mongoose from "mongoose";
import { AggregationName } from "@shared/enums";
import { EntryType } from "@shared/enums";

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

    params: {
      type: {
        type: String,
        enum: Object.values(EntryType).map((t) => t.id),
        required: false,
      },
      bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: false,
      },
      headId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Head",
        required: false,
      },
      tagId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
        required: false,
      },
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
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
