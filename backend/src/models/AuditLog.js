import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    event: {
      type: String,
      enum: ["create", "update", "delete"],
      required: true,
    },

    docType: {
      type: String,
      required: true,
    },

    docId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    dataBefore: {
      type: mongoose.Schema.Types.Mixed,
    },

    dataAfter: {
      type: mongoose.Schema.Types.Mixed,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    collection: "audit_logs",
    versionKey: false,
    timestamps: false,
  },
);

export default mongoose.model("AuditLog", auditLogSchema);
