import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBankingSettingsDocument extends Document {
  minimumAccountBalance: number;
  dailyTransferLimit: number;
  maximumTransactionAmount: number;
  transferFeePercentage: number;
  minTransferFee: number;
  suspiciousTransactionThreshold: number;
  rapidTransactionWindowMinutes: number;
  rapidTransactionCountLimit: number;
  loanInterestRateDefault: number;
  maxLoanDurationMonths: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BankingSettingsSchema = new Schema<IBankingSettingsDocument>(
  {
    minimumAccountBalance: {
      type: Number,
      default: 50,
      min: 0,
    },
    dailyTransferLimit: {
      type: Number,
      default: 10000,
      min: 100,
    },
    maximumTransactionAmount: {
      type: Number,
      default: 50000,
      min: 500,
    },
    transferFeePercentage: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 10,
    },
    minTransferFee: {
      type: Number,
      default: 1.0,
      min: 0,
    },
    suspiciousTransactionThreshold: {
      type: Number,
      default: 15000,
      min: 1000,
    },
    rapidTransactionWindowMinutes: {
      type: Number,
      default: 5,
      min: 1,
    },
    rapidTransactionCountLimit: {
      type: Number,
      default: 4,
      min: 2,
    },
    loanInterestRateDefault: {
      type: Number,
      default: 7.5,
      min: 0,
    },
    maxLoanDurationMonths: {
      type: Number,
      default: 60,
      min: 6,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const BankingSettings: Model<IBankingSettingsDocument> =
  mongoose.models.BankingSettings ||
  mongoose.model<IBankingSettingsDocument>(
    "BankingSettings",
    BankingSettingsSchema
  );

export default BankingSettings;
