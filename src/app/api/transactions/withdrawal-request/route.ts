import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { BankAccount } from "@/models/BankAccount";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { Notification } from "@/models/Notification";
import {
  ACCOUNT_STATUS,
  REQUEST_STATUS,
  NOTIFICATION_TYPES,
} from "@/lib/constants";
import { formatCurrency, safeSubtract } from "@/lib/money";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const { accountId, amount, description = "Online Withdrawal Request" } =
      body;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid withdrawal amount." },
        { status: 400 }
      );
    }

    const account = await BankAccount.findById(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Account not found." },
        { status: 404 }
      );
    }

    if (account.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You do not own this account." },
        { status: 403 }
      );
    }

    if (account.status !== ACCOUNT_STATUS.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          error: `Account is ${account.status.toLowerCase()}. Cannot submit withdrawals.`,
        },
        { status: 400 }
      );
    }

    const effectiveAvailable = safeSubtract(
      account.availableBalance,
      account.minimumBalance || 0
    );
    if (effectiveAvailable < withdrawAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient available funds for withdrawal. Maximum available: ${formatCurrency(
            effectiveAvailable
          )}.`,
        },
        { status: 400 }
      );
    }

    const request = await WithdrawalRequest.create({
      accountId: account._id,
      userId: user._id,
      amount: withdrawAmount,
      description,
      status: REQUEST_STATUS.PENDING,
    });

    await Notification.create({
      userId: user._id,
      title: "Withdrawal Request Submitted",
      message: `Your withdrawal request for ${formatCurrency(
        withdrawAmount
      )} from Account #${account.accountNumber} has been submitted for branch review.`,
      type: NOTIFICATION_TYPES.SECURITY_ALERT,
    });

    return NextResponse.json({
      success: true,
      message: `Withdrawal request for ${formatCurrency(
        withdrawAmount
      )} submitted for branch review.`,
      request,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Withdrawal request failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
