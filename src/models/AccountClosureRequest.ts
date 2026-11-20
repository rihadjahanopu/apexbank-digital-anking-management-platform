import mongoose, { Schema, Document, Model } from "mongoose";
import { RequestStatus, REQUEST_STATUS } from "@/lib/constants";

export interface IAccountClosureRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  reason: string;
  balance: number;
  targetPayoutAccount?: string;
  status: RequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  adminRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountClosureRequestSchema = new Schema<IAccountClosureRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    targetPayoutAccount: {
      type: String,
      trim: true,
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

AccountClosureRequestSchema.index({ userId: 1, status: 1 });
AccountClosureRequestSchema.index({ accountId: 1, status: 1 });

export const AccountClosureRequest: Model<IAccountClosureRequestDocument> =
  mongoose.models.AccountClosureRequest ||
  mongoose.model<IAccountClosureRequestDocument>(
    "AccountClosureRequest",
    AccountClosureRequestSchema
  );

export default AccountClosureRequest;
