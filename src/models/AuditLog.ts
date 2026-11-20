import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLogDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  userRole?: string;
  action: string;
  category: "AUTH" | "TRANSACTION" | "ACCOUNT" | "LOAN" | "SETTINGS" | "CUSTOMER";
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userRole: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["AUTH", "TRANSACTION", "ACCOUNT", "LOAN", "SETTINGS", "CUSTOMER"],
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLog: Model<IAuditLogDocument> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);

export default AuditLog;
