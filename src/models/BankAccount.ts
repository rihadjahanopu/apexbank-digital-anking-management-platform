import mongoose, { Schema, Document, Model } from "mongoose";
import {
  AccountType,
  AccountStatus,
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
} from "@/lib/constants";

export interface IBankAccountDocument extends Document {
  accountNumber: string;
  userId: mongoose.Types.ObjectId;
  accountType: AccountType;
  status: AccountStatus;
  balance: number;
  availableBalance: number;
  currency: string;
  dailyTransferLimit: number;
  minimumBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const BankAccountSchema = new Schema<IBankAccountDocument>(
  {
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    accountType: {
      type: String,
      enum: Object.values(ACCOUNT_TYPES),
      default: ACCOUNT_TYPES.SAVINGS,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    availableBalance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Available balance cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    dailyTransferLimit: {
      type: Number,
      default: 10000,
      min: 0,
    },
    minimumBalance: {
      type: Number,
      default: 50,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const BankAccount: Model<IBankAccountDocument> =
  mongoose.models.BankAccount ||
  mongoose.model<IBankAccountDocument>("BankAccount", BankAccountSchema);

export default BankAccount;
