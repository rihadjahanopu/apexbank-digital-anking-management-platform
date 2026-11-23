import mongoose, { Schema, Document, Model } from "mongoose";
import {
  AccountType,
  AccountStatus,
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
} from "@/lib/constants";

export interface INominee {
  name: string;
  relation: string;
  phone?: string;
  nationalId?: string;
  sharePercent: number;
  address?: string;
}

export interface IEmploymentInfo {
  occupation?: string;
  employerName?: string;
  monthlyIncome?: number;
  sourceOfFunds?: string;
  taxId?: string;
}

export interface IAccountServices {
  debitCardRequested: boolean;
  chequeBookRequested: boolean;
  smsAlerts: boolean;
  eStatement: boolean;
}

export interface IKycSnapshot {
  docType?: string;
  docNumber?: string;
  verifiedViaOcr?: boolean;
  ocrConfidence?: number;
  docFrontUrl?: string;
  docBackUrl?: string;
}

export interface IBankAccountDocument extends Document {
  accountNumber: string;
  userId: mongoose.Types.ObjectId;
  accountType: AccountType;
  status: AccountStatus;
  balance: number;
  availableBalance: number;
  currency: string;
  branchName?: string;
  routingNumber?: string;
  swiftBic?: string;
  iban?: string;
  dailyTransferLimit: number;
  minimumBalance: number;
  nominee?: INominee;
  employmentInfo?: IEmploymentInfo;
  services?: IAccountServices;
  signatureUrl?: string;
  kycSnapshot?: IKycSnapshot;
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
    branchName: {
      type: String,
      default: "Main Financial Center Branch",
      trim: true,
    },
    routingNumber: {
      type: String,
      default: "026007491",
      trim: true,
    },
    swiftBic: {
      type: String,
      default: "AGBKUS33",
      trim: true,
    },
    iban: {
      type: String,
      trim: true,
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
    nominee: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      phone: { type: String, trim: true },
      nationalId: { type: String, trim: true },
      sharePercent: { type: Number, default: 100 },
      address: { type: String, trim: true },
    },
    employmentInfo: {
      occupation: { type: String, trim: true },
      employerName: { type: String, trim: true },
      monthlyIncome: { type: Number, default: 0 },
      sourceOfFunds: { type: String, trim: true },
      taxId: { type: String, trim: true },
    },
    services: {
      debitCardRequested: { type: Boolean, default: true },
      chequeBookRequested: { type: Boolean, default: false },
      smsAlerts: { type: Boolean, default: true },
      eStatement: { type: Boolean, default: true },
    },
    signatureUrl: {
      type: String,
    },
    kycSnapshot: {
      docType: { type: String },
      docNumber: { type: String },
      verifiedViaOcr: { type: Boolean, default: false },
      ocrConfidence: { type: Number, default: 0 },
      docFrontUrl: { type: String },
      docBackUrl: { type: String },
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
