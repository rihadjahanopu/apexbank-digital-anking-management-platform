import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { BankAccount } from "@/models/BankAccount";
import { DepositRequest } from "@/models/DepositRequest";
import { Notification } from "@/models/Notification";
import {
  ACCOUNT_STATUS,
  REQUEST_STATUS,
  NOTIFICATION_TYPES,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/money";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const { accountId, amount, description = "Online Deposit Request" } = body;

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid deposit amount." },
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
          error: `Account is ${account.status.toLowerCase()}. Cannot submit deposits.`,
        },
        { status: 400 }
      );
    }

    const request = await DepositRequest.create({
      accountId: account._id,
      userId: user._id,
      amount: depositAmount,
      description,
      status: REQUEST_STATUS.PENDING,
    });

    await Notification.create({
      userId: user._id,
      title: "Deposit Request Submitted",
      message: `Your deposit request for ${formatCurrency(
        depositAmount
      )} into Account #${account.accountNumber} is awaiting branch review.`,
      type: NOTIFICATION_TYPES.SECURITY_ALERT,
    });

    return NextResponse.json({
      success: true,
      message: `Deposit request for ${formatCurrency(
        depositAmount
      )} submitted for branch review.`,
      request,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Deposit request failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
