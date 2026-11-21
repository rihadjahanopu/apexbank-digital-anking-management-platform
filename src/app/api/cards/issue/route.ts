import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/models/Card";
import { BankAccount } from "@/models/BankAccount";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, ACCOUNT_STATUS, CARD_STATUS, CARD_TYPES, CARD_NETWORKS } from "@/lib/constants";
import { generateCardNumber, generateCVV, maskCardNumber } from "@/lib/cards";

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
    const { accountId, cardType = CARD_TYPES.VIRTUAL, network = CARD_NETWORKS.VISA, pin = "1234" } = body;

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "Depository account ID is required." },
        { status: 400 }
      );
    }

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: "Card PIN must be exactly 4 digits." },
        { status: 400 }
      );
    }

    // Verify account existence and ownership
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
        {
          success: false,
          error: "Cards can only be issued for ACTIVE bank accounts.",
        },
        { status: 400 }
      );
    }

    // Prevent issuing more than 5 active cards per account
    const existingActiveCards = await Card.countDocuments({
      accountId: account._id,
      status: CARD_STATUS.ACTIVE,
    });
    if (existingActiveCards >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum card limit reached for this account (max 5 active cards).",
        },
        { status: 400 }
      );
    }

    // Generate Card Numbers
    const fullPan = generateCardNumber(network);
    const maskedPan = maskCardNumber(fullPan);
    const cvv = generateCVV();
    const now = new Date();
    const expiryMonth = now.getMonth() + 1;
    const expiryYear = now.getFullYear() + 4; // 4-year validity
    const hashedPin = await bcrypt.hash(pin, 10);

    const card = await Card.create({
      userId: account.userId,
      accountId: account._id,
      cardNumber: fullPan,
      maskedCardNumber: maskedPan,
      cardHolderName: account.accountNumber, // or user name
      cardType,
      network,
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

    await AuditLog.create({
      userId: authUser._id,
      userRole: authUser.role,
      action: "CARD_ISSUED",
      category: "ACCOUNT",
      details: {
        cardId: card._id,
        maskedPan,
        network,
        cardType,
        accountId: account._id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Virtual card generated and issued successfully!",
      card: {
        _id: card._id,
        maskedCardNumber: maskedPan,
        cardNumber: fullPan, // Revealed once upon issuance
        cvv,                 // Revealed once upon issuance
        cardHolderName: card.cardHolderName,
        cardType: card.cardType,
        network: card.network,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        status: card.status,
        dailyOnlineLimit: card.dailyOnlineLimit,
        dailyAtmLimit: card.dailyAtmLimit,
        dailyPosLimit: card.dailyPosLimit,
        isOnlineEnabled: card.isOnlineEnabled,
        isAtmEnabled: card.isAtmEnabled,
        isPosEnabled: card.isPosEnabled,
        isInternationalEnabled: card.isInternationalEnabled,
        createdAt: card.createdAt,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to issue card";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
