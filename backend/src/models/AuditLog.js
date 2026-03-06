import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      match: /^(system|[a-zA-Z0-9]{28})$/,
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
      default: null,
    },

    dataAfter: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "audit_logs",
    versionKey: false,
    timestamps: false,
  },
);

export default mongoose.model("AuditLog", auditLogSchema);
