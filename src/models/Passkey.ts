import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPasskeyDocument extends Document {
  userId: mongoose.Types.ObjectId;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceType: "singleDevice" | "multiDevice";
  backedUp: boolean;
  transports: string[];
  aaguid?: string;
  name: string;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PasskeySchema = new Schema<IPasskeyDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    credentialId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publicKey: {
      type: String,
      required: true,
    },
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
    deviceType: {
      type: String,
      enum: ["singleDevice", "multiDevice"],
      default: "singleDevice",
    },
    backedUp: {
      type: Boolean,
      default: false,
    },
    transports: {
      type: [String],
      default: [],
    },
    aaguid: {
      type: String,
    },
    name: {
      type: String,
      required: true,
      default: "Security Passkey",
      trim: true,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Passkey) {
  delete (mongoose.models as Record<string, unknown>).Passkey;
}

export const Passkey: Model<IPasskeyDocument> =
  mongoose.models.Passkey ||
  mongoose.model<IPasskeyDocument>("Passkey", PasskeySchema);

export default Passkey;
