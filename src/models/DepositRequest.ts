import mongoose, { Schema, Document, Model } from "mongoose";
import { RequestStatus, REQUEST_STATUS } from "@/lib/constants";

export interface IDepositRequestDocument extends Document {
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

const DepositRequestSchema = new Schema<IDepositRequestDocument>(
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
      min: [1, "Minimum deposit request is $1.00"],
    },
    description: {
      type: String,
      default: "Online Deposit Request",
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

export const DepositRequest: Model<IDepositRequestDocument> =
  mongoose.models.DepositRequest ||
  mongoose.model<IDepositRequestDocument>("DepositRequest", DepositRequestSchema);

export default DepositRequest;
