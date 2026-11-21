import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { CardRequest } from "@/models/CardRequest";
import { Card } from "@/models/Card";
import { BankAccount } from "@/models/BankAccount";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import {
  ROLES,
  REQUEST_STATUS,
  CARD_STATUS,
  CARD_REQUEST_TYPES,
  NOTIFICATION_TYPES,
} from "@/lib/constants";
import { generateCardNumber, generateCVV, maskCardNumber } from "@/lib/cards";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !authUser) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { action, adminRemarks = "" } = body; // action: "APPROVE" | "REJECT"

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    const cardRequest = await CardRequest.findById(id);
    if (!cardRequest) {
      return NextResponse.json(
        { success: false, error: "Card request not found." },
        { status: 404 }
      );
    }

    if (cardRequest.status !== REQUEST_STATUS.PENDING) {
      return NextResponse.json(
        {
          success: false,
          error: `Card request has already been ${cardRequest.status.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    // Customer / staff cannot approve their own requests
    if (cardRequest.userId.toString() === authUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Staff cannot review their own card requests." },
        { status: 403 }
      );
    }

    if (action === "APPROVE") {
      if (cardRequest.requestType === CARD_REQUEST_TYPES.ISSUE) {
        // Verify account is active
        const account = await BankAccount.findById(cardRequest.accountId);
        if (!account) {
          return NextResponse.json(
            { success: false, error: "Associated bank account not found." },
            { status: 404 }
          );
        }

        const customer = await User.findById(cardRequest.userId);
        const cardHolderName = (customer?.name || "CARD HOLDER").toUpperCase();

        // Generate card details
        const cardNumber = generateCardNumber(cardRequest.network);
        const masked = maskCardNumber(cardNumber);
        const cvv = generateCVV();
        const hashedPin = await bcrypt.hash("1234", 10);

        const now = new Date();
        const expiryMonth = now.getMonth() + 1;
        const expiryYear = now.getFullYear() + 3;

        const newCard = await Card.create({
          userId: cardRequest.userId,
          accountId: cardRequest.accountId,
          cardNumber,
          maskedCardNumber: masked,
          cardHolderName,
          cardType: cardRequest.cardType,
          network: cardRequest.network,
          expiryMonth,
          expiryYear,
          cvv,
          pin: hashedPin,
          status: CARD_STATUS.ACTIVE,
          dailyOnlineLimit: 2500,
          dailyAtmLimit: 1000,
          dailyPosLimit: 3000,
          isOnlineEnabled: true,
          isAtmEnabled: true,
          isPosEnabled: true,
          isInternationalEnabled: false,
        });

        cardRequest.status = REQUEST_STATUS.APPROVED;
        cardRequest.issuedCardId = newCard._id;
        cardRequest.reviewedBy = authUser._id;
        cardRequest.reviewedAt = new Date();
        cardRequest.adminRemarks = adminRemarks;
        await cardRequest.save();

        await Notification.create({
          userId: cardRequest.userId,
          title: "New Card Issued",
          message: `Your request for a ${cardRequest.network} ${cardRequest.cardType} card has been approved. Card ending in ${cardNumber.slice(-4)} is now active. (Default PIN: 1234)`,
          type: NOTIFICATION_TYPES.CARD_REQUEST_APPROVED,
          link: "/customer/cards",
        });

        await AuditLog.create({
          userId: authUser._id,
          userRole: authUser.role,
          action: "CARD_ISSUE_REQUEST_APPROVED",
          category: "ACCOUNT",
          details: {
            requestId: cardRequest._id,
            issuedCardId: newCard._id,
            maskedCardNumber: masked,
          },
        });

        return NextResponse.json({
          success: true,
          message: `Card issue request approved. Card ending in ${cardNumber.slice(-4)} has been generated and activated.`,
          data: cardRequest,
        });
      } else {
        // Request Type: REMOVE / CANCEL
        if (!cardRequest.cardId) {
          return NextResponse.json(
            { success: false, error: "Target card ID missing from request." },
            { status: 400 }
          );
        }

        const card = await Card.findById(cardRequest.cardId);
        if (card) {
          card.status = CARD_STATUS.BLOCKED;
          await card.save();
        }

        cardRequest.status = REQUEST_STATUS.APPROVED;
        cardRequest.reviewedBy = authUser._id;
        cardRequest.reviewedAt = new Date();
        cardRequest.adminRemarks = adminRemarks;
        await cardRequest.save();

        await Notification.create({
          userId: cardRequest.userId,
          title: "Card Cancelled / Blocked",
          message: `Your request to remove card ending in ${card ? card.maskedCardNumber.slice(-4) : ""} has been approved. The card has been permanently blocked.`,
          type: NOTIFICATION_TYPES.CARD_REQUEST_APPROVED,
          link: "/customer/cards",
        });

        await AuditLog.create({
          userId: authUser._id,
          userRole: authUser.role,
          action: "CARD_REMOVAL_REQUEST_APPROVED",
          category: "ACCOUNT",
          details: {
            requestId: cardRequest._id,
            cardId: cardRequest.cardId,
            remarks: adminRemarks,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Card cancellation approved and card has been blocked.",
          data: cardRequest,
        });
      }
    } else {
      // REJECT
      cardRequest.status = REQUEST_STATUS.REJECTED;
      cardRequest.reviewedBy = authUser._id;
      cardRequest.reviewedAt = new Date();
      cardRequest.adminRemarks = adminRemarks;
      await cardRequest.save();

      await Notification.create({
        userId: cardRequest.userId,
        title: "Card Request Rejected",
        message: `Your card ${cardRequest.requestType.toLowerCase()} request was rejected. Reason: ${adminRemarks || "Does not meet verification requirements."}`,
        type: NOTIFICATION_TYPES.CARD_REQUEST_REJECTED,
        link: "/customer/cards",
      });

      await AuditLog.create({
        userId: authUser._id,
        userRole: authUser.role,
        action: `CARD_${cardRequest.requestType}_REQUEST_REJECTED`,
        category: "ACCOUNT",
        details: {
          requestId: cardRequest._id,
          reason: adminRemarks,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Card ${cardRequest.requestType.toLowerCase()} request has been rejected.`,
        data: cardRequest,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to review card request.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
