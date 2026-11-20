import mongoose, { Schema, Document, Model } from "mongoose";
import {
  CardType,
  CardNetwork,
  CardStatus,
  CARD_TYPES,
  CARD_NETWORKS,
  CARD_STATUS,
} from "@/lib/constants";

export interface ICardDocument extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  cardNumber: string;
  maskedCardNumber: string;
  cardHolderName: string;
  cardType: CardType;
  network: CardNetwork;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  pin?: string;
  status: CardStatus;
  dailyOnlineLimit: number;
  dailyAtmLimit: number;
  dailyPosLimit: number;
  isOnlineEnabled: boolean;
  isAtmEnabled: boolean;
  isPosEnabled: boolean;
  isInternationalEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<ICardDocument>(
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
    cardNumber: {
      type: String,
      required: true,
      unique: true,
      select: false, // Protected: require explicit selection
    },
    maskedCardNumber: {
      type: String,
      required: true,
      index: true,
    },
    cardHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    cardType: {
      type: String,
      enum: Object.values(CARD_TYPES),
      default: CARD_TYPES.VIRTUAL,
    },
    network: {
      type: String,
      enum: Object.values(CARD_NETWORKS),
      default: CARD_NETWORKS.VISA,
    },
    expiryMonth: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    expiryYear: {
      type: Number,
      required: true,
    },
    cvv: {
      type: String,
      required: true,
      select: false, // Protected: require explicit selection
    },
    pin: {
      type: String,
      select: false, // Bcrypt hashed card PIN
    },
    status: {
      type: String,
      enum: Object.values(CARD_STATUS),
      default: CARD_STATUS.ACTIVE,
      index: true,
    },
    dailyOnlineLimit: {
      type: Number,
      default: 2000,
    },
    dailyAtmLimit: {
      type: Number,
      default: 1000,
    },
    dailyPosLimit: {
      type: Number,
      default: 3000,
    },
    isOnlineEnabled: {
      type: Boolean,
      default: true,
    },
    isAtmEnabled: {
      type: Boolean,
      default: true,
    },
    isPosEnabled: {
      type: Boolean,
      default: true,
    },
    isInternationalEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Card: Model<ICardDocument> =
  mongoose.models.Card || mongoose.model<ICardDocument>("Card", CardSchema);

export default Card;
