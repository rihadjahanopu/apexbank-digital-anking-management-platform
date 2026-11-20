import mongoose, { Schema, Document, Model } from "mongoose";
import {
  CardRequestType,
  CARD_REQUEST_TYPES,
  CardType,
  CARD_TYPES,
  CardNetwork,
  CARD_NETWORKS,
  RequestStatus,
  REQUEST_STATUS,
} from "@/lib/constants";

export interface ICardRequestDocument extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  requestType: CardRequestType;
  cardId?: mongoose.Types.ObjectId;
  cardType?: CardType;
  network?: CardNetwork;
  reason: string;
  status: RequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  adminRemarks?: string;
  issuedCardId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CardRequestSchema = new Schema<ICardRequestDocument>(
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
    requestType: {
      type: String,
      enum: Object.values(CARD_REQUEST_TYPES),
      required: true,
      index: true,
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: "Card",
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
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
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
    adminRemarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    issuedCardId: {
      type: Schema.Types.ObjectId,
      ref: "Card",
    },
  },
  {
    timestamps: true,
  }
);

CardRequestSchema.index({ userId: 1, status: 1 });
CardRequestSchema.index({ accountId: 1, status: 1 });

export const CardRequest: Model<ICardRequestDocument> =
  mongoose.models.CardRequest ||
  mongoose.model<ICardRequestDocument>("CardRequest", CardRequestSchema);

export default CardRequest;
