import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AccountClosureRequest } from "@/models/AccountClosureRequest";
import { BankAccount } from "@/models/BankAccount";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, ACCOUNT_STATUS, REQUEST_STATUS } from "@/lib/constants";

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
    const { accountId, reason, targetPayoutAccount } = body;

    if (!accountId || !reason) {
      return NextResponse.json(
        { success: false, error: "Bank account ID and reason for closure are required." },
        { status: 400 }
      );
    }

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

    if (account.status === ACCOUNT_STATUS.CLOSED) {
      return NextResponse.json(
        { success: false, error: "This bank account is already closed." },
        { status: 400 }
      );
    }

    const existingPending = await AccountClosureRequest.findOne({
      accountId: account._id,
      status: REQUEST_STATUS.PENDING,
    });
    if (existingPending) {
      return NextResponse.json(
        {
          success: false,
          error: "A closure request for this account is already pending administrative review.",
        },
        { status: 400 }
      );
    }

    const closureRequest = await AccountClosureRequest.create({
      userId: authUser._id,
      accountId: account._id,
      reason: reason.trim(),
      balance: account.balance,
      targetPayoutAccount: targetPayoutAccount ? targetPayoutAccount.trim() : undefined,
      status: REQUEST_STATUS.PENDING,
    });

    await AuditLog.create({
      userId: authUser._id,
      userRole: authUser.role,
      action: "ACCOUNT_CLOSURE_REQUESTED",
      category: "ACCOUNT",
      details: {
        requestId: closureRequest._id,
        accountId: account._id,
        accountNumber: account.accountNumber,
        balance: account.balance,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account closure request submitted successfully. A bank officer will review it.",
        data: closureRequest,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit account closure request.";
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (status && Object.values(REQUEST_STATUS).includes(status as (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS])) {
      query.status = status;
    }

    const [requests, total] = await Promise.all([
      AccountClosureRequest.find(query)
        .populate("userId", "name email role isVerified")
        .populate("accountId", "accountNumber accountType status balance")
        .populate("reviewedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AccountClosureRequest.countDocuments(query),
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
    const message = error instanceof Error ? error.message : "Failed to fetch account closure requests.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
