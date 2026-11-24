import mongoose, { Schema, Document, Model } from "mongoose";
import { RequestStatus, REQUEST_STATUS } from "@/lib/constants";

export interface IPinResetRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  reason: string;
  status: RequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  adminRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PinResetRequestSchema = new Schema<IPinResetRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    adminRemarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

export const PinResetRequest: Model<IPinResetRequestDocument> =
  mongoose.models.PinResetRequest ||
  mongoose.model<IPinResetRequestDocument>("PinResetRequest", PinResetRequestSchema);

export default PinResetRequest;
