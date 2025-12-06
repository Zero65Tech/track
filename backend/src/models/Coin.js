import mongoose from "mongoose";
import { CoinLedgerRef, CoinLedgerType } from "@zero65/track";

const coinSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },

    ref: {
      // TODO
      type: {
        type: String,
        enum: Object.values(CoinLedgerRef).map((t) => t.id),
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    type: {
      type: String,
      enum: Object.values(CoinLedgerType).map((t) => t.id),
      required: true,
    },

    nova: {
      type: Number,
      required: true,
    },
    novaTotal: {
      type: Number,
      min: 0,
      required: true,
    },

    pulse: {
      type: Number,
      required: true,
    },
    pulseTotal: {
      type: Number,
      required: true,
    },

    latest: {
      type: Boolean,
      required: true,
    },
  },
  {
    collection: "coins",
    versionKey: false,
    timestamps: true,
  },
);

export default mongoose.model("Coin", coinSchema);
