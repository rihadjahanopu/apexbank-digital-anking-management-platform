import mongoose, { Schema, Document, Model } from "mongoose";
import { RequestStatus, REQUEST_STATUS } from "@/lib/constants";

export interface IWithdrawalRequestDocument extends Document {
  accountId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  status: RequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema = new Schema<IWithdrawalRequestDocument>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Minimum withdrawal request is $1.00"],
    },
    description: {
      type: String,
      default: "Online Withdrawal Request",
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
    adminNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const WithdrawalRequest: Model<IWithdrawalRequestDocument> =
  mongoose.models.WithdrawalRequest ||
  mongoose.model<IWithdrawalRequestDocument>(
    "WithdrawalRequest",
    WithdrawalRequestSchema
  );

export default WithdrawalRequest;
