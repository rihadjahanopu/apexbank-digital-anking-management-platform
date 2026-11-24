import mongoose, { Schema, Document, Model } from "mongoose";
import {
  TransactionType,
  TransactionStatus,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
} from "@/lib/constants";

export interface ITransactionDocument extends Document {
  transactionId: string;
  senderAccount?: mongoose.Types.ObjectId;
  receiverAccount?: mongoose.Types.ObjectId;
  senderUserId?: mongoose.Types.ObjectId;
  receiverUserId?: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  fee: number;
  status: TransactionStatus;
  description: string;
  reference?: string;
  isSuspicious: boolean;
  suspiciousReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  initiatedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    senderAccount: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      index: true,
    },
    receiverAccount: {
      type: Schema.Types.ObjectId,
      ref: "BankAccount",
      index: true,
    },
    senderUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    receiverUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be at least 0.01"],
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.COMPLETED,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    reference: {
      type: String,
      index: true,
    },
    isSuspicious: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspiciousReason: {
      type: String,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Force re-registration so added enum values (BANGLA_QR_PAYMENT, MOBILE_RECHARGE)
// are reflected even when Mongoose has a stale cached schema in hot-reload / dev.
if (mongoose.models.Transaction) {
  const existing = mongoose.models.Transaction;
  const enumValues: string[] = (existing.schema.path("type") as { enumValues?: string[] })?.enumValues ?? [];
  const expected = Object.values(TRANSACTION_TYPES);
  if (expected.some((v) => !enumValues.includes(v))) {
    delete mongoose.models.Transaction;
  }
}

export const Transaction: Model<ITransactionDocument> =
  mongoose.models.Transaction ||
  mongoose.model<ITransactionDocument>("Transaction", TransactionSchema);

export default Transaction;
