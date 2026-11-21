import mongoose, { Schema, Document, Model } from "mongoose";
import { UserRole, UserStatus, ROLES, USER_STATUS, KycDocumentType, KycStatus, KYC_DOCUMENT_TYPES, KYC_STATUS } from "@/lib/constants";

export interface IKycDocumentItem {
  _id?: mongoose.Types.ObjectId;
  docType: KycDocumentType;
  docNumber: string;
  docUrl: string;
  status: KycStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  remarks?: string;
}

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  address?: string;
  nationalId?: string;
  transactionPin?: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  currentChallenge?: string;
  kycDocuments: IKycDocumentItem[];
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    nationalId: {
      type: String,
      trim: true,
      index: true,
    },
    transactionPin: {
      type: String,
      select: false, // Don't return PIN by default
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false, // Protected: only selected during verification
    },
    currentChallenge: {
      type: String,
      select: false, // Protected: temporary challenge for WebAuthn
    },
    kycDocuments: [
      {
        docType: {
          type: String,
          enum: Object.values(KYC_DOCUMENT_TYPES),
          required: true,
        },
        docNumber: {
          type: String,
          required: true,
        },
        docUrl: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: Object.values(KYC_STATUS),
          default: KYC_STATUS.PENDING,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        reviewedAt: Date,
        reviewedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        remarks: String,
      },
    ],
    avatarUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of model in Next.js hot reload
export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
