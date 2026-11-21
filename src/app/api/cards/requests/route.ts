import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { CardRequest } from "@/models/CardRequest";
import { BankAccount } from "@/models/BankAccount";
import { Card } from "@/models/Card";
import { AuditLog } from "@/models/AuditLog";
import {
  ROLES,
  ACCOUNT_STATUS,
  CARD_STATUS,
  CARD_REQUEST_TYPES,
  CARD_TYPES,
  CARD_NETWORKS,
  REQUEST_STATUS,
} from "@/lib/constants";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req, [
      ROLES.CUSTOMER,
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !authUser) return errorResponse;

    const body = await req.json();
    const {
      accountId,
      requestType,
      cardId,
      cardType = CARD_TYPES.VIRTUAL,
      network = CARD_NETWORKS.VISA,
      reason,
    } = body;

    if (!accountId || !requestType || !reason) {
      return NextResponse.json(
        { success: false, error: "Account ID, request type, and reason are required." },
        { status: 400 }
      );
    }

    if (!Object.values(CARD_REQUEST_TYPES).includes(requestType)) {
      return NextResponse.json(
        { success: false, error: "Invalid card request type. Must be ISSUE or REMOVE." },
        { status: 400 }
      );
    }

    // Verify account exists and user has rights
    const account = await BankAccount.findById(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Bank account not found." },
        { status: 404 }
      );
    }

    if (
      authUser.role === ROLES.CUSTOMER &&
      account.userId.toString() !== authUser._id.toString()
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to this bank account." },
        { status: 403 }
      );
    }

    if (account.status !== ACCOUNT_STATUS.ACTIVE) {
      return NextResponse.json(
        { success: false, error: "Card requests can only be made for ACTIVE accounts." },
        { status: 400 }
      );
    }

    if (requestType === CARD_REQUEST_TYPES.ISSUE) {
      // Check active cards limit
      const activeCardCount = await Card.countDocuments({
        accountId: account._id,
        status: CARD_STATUS.ACTIVE,
      });
      if (activeCardCount >= 5) {
        return NextResponse.json(
          { success: false, error: "This account already has the maximum limit of 5 active cards." },
          { status: 400 }
        );
      }

      // Check for pending issue request
      const existingPending = await CardRequest.findOne({
        accountId: account._id,
        requestType: CARD_REQUEST_TYPES.ISSUE,
        status: REQUEST_STATUS.PENDING,
      });
      if (existingPending) {
        return NextResponse.json(
          {
            success: false,
            error: "You already have a pending card issue request for this account.",
          },
          { status: 400 }
        );
      }

      const cardRequest = await CardRequest.create({
        userId: authUser._id,
        accountId: account._id,
        requestType: CARD_REQUEST_TYPES.ISSUE,
        cardType,
        network,
        reason: reason.trim(),
        status: REQUEST_STATUS.PENDING,
      });

      await AuditLog.create({
        userId: authUser._id,
        userRole: authUser.role,
        action: "CARD_ISSUE_REQUESTED",
        category: "ACCOUNT",
        details: {
          requestId: cardRequest._id,
          accountId: account._id,
          cardType,
          network,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Card issue request submitted successfully. A bank officer will review it shortly.",
          data: cardRequest,
        },
        { status: 201 }
      );
    } else {
      // REMOVE request
      if (!cardId) {
        return NextResponse.json(
          { success: false, error: "Card ID is required for card cancellation request." },
          { status: 400 }
        );
      }

      const card = await Card.findById(cardId);
      if (!card) {
        return NextResponse.json(
          { success: false, error: "Target card not found." },
          { status: 404 }
        );
      }

      if (
        authUser.role === ROLES.CUSTOMER &&
        card.userId.toString() !== authUser._id.toString()
      ) {
        return NextResponse.json(
          { success: false, error: "Unauthorized access to this card." },
          { status: 403 }
        );
      }

      if (card.status === CARD_STATUS.BLOCKED) {
        return NextResponse.json(
          { success: false, error: "This card is already blocked or cancelled." },
          { status: 400 }
        );
      }

      const existingPending = await CardRequest.findOne({
        cardId: card._id,
        requestType: CARD_REQUEST_TYPES.REMOVE,
        status: REQUEST_STATUS.PENDING,
      });
      if (existingPending) {
        return NextResponse.json(
          {
            success: false,
            error: "A cancellation request for this card is already pending review.",
          },
          { status: 400 }
        );
      }

      const cardRequest = await CardRequest.create({
        userId: authUser._id,
        accountId: card.accountId,
        cardId: card._id,
        requestType: CARD_REQUEST_TYPES.REMOVE,
        cardType: card.cardType,
        network: card.network,
        reason: reason.trim(),
        status: REQUEST_STATUS.PENDING,
      });

      await AuditLog.create({
        userId: authUser._id,
        userRole: authUser.role,
        action: "CARD_REMOVAL_REQUESTED",
        category: "ACCOUNT",
        details: {
          requestId: cardRequest._id,
          cardId: card._id,
          maskedCardNumber: card.maskedCardNumber,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Card cancellation request submitted successfully.",
          data: cardRequest,
        },
        { status: 201 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit card request.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !authUser) return errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const requestType = searchParams.get("requestType");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (status && Object.values(REQUEST_STATUS).includes(status as (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS])) {
      query.status = status;
    }
    if (requestType && Object.values(CARD_REQUEST_TYPES).includes(requestType as (typeof CARD_REQUEST_TYPES)[keyof typeof CARD_REQUEST_TYPES])) {
      query.requestType = requestType;
    }

    const [requests, total] = await Promise.all([
      CardRequest.find(query)
        .populate("userId", "name email role isVerified")
        .populate("accountId", "accountNumber accountType status balance")
        .populate("cardId", "maskedCardNumber cardType network status")
        .populate("issuedCardId", "maskedCardNumber cardType network status")
        .populate("reviewedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CardRequest.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch card requests.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
