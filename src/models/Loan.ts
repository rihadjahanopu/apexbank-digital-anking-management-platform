import mongoose, { Schema, Document, Model } from "mongoose";
import { LoanType, LoanStatus, LOAN_TYPES, LOAN_STATUS } from "@/lib/constants";

export interface IRepaymentScheduleItem {
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: "PENDING" | "PAID" | "OVERDUE";
  transactionId?: string;
}

export interface ILoanDocument extends Document {
  loanNumber: string;
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  loanType: LoanType;
  amount: number;
  interestRate: number;
  durationMonths: number;
  monthlyRepayment: number;
  totalRepayment: number;
  remainingBalance: number;
  monthlyIncome: number;
  employmentStatus: string;
  purpose: string;
  status: LoanStatus;
  internalNotes?: string;
  forwardedToAdmin: boolean;
  reviewedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;
  repayments: IRepaymentScheduleItem[];
  createdAt: Date;
  updatedAt: Date;
}

const RepaymentItemSchema = new Schema<IRepaymentScheduleItem>(
  {
    installmentNumber: { type: Number, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "OVERDUE"],
      default: "PENDING",
    },
    transactionId: { type: String },
  },
  { _id: true }
);

const LoanSchema = new Schema<ILoanDocument>(
  {
    loanNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    },
    loanType: {
      type: String,
      enum: Object.values(LOAN_TYPES),
      default: LOAN_TYPES.PERSONAL,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [100, "Minimum loan amount is $100"],
    },
    interestRate: {
      type: Number,
      required: true,
      default: 7.5,
    },
    durationMonths: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },
    monthlyRepayment: {
      type: Number,
      required: true,
    },
    totalRepayment: {
      type: Number,
      required: true,
    },
    remainingBalance: {
      type: Number,
      required: true,
    },
    monthlyIncome: {
      type: Number,
      required: true,
    },
    employmentStatus: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LOAN_STATUS),
      default: LOAN_STATUS.PENDING,
      index: true,
    },
    internalNotes: {
      type: String,
    },
    forwardedToAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    disbursedAt: {
      type: Date,
    },
    repayments: [RepaymentItemSchema],
  },
  {
    timestamps: true,
  }
);

export const Loan: Model<ILoanDocument> =
  mongoose.models.Loan || mongoose.model<ILoanDocument>("Loan", LoanSchema);

export default Loan;
