import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { BankAccount } from "@/models/BankAccount";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import {
  ROLES,
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
} from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !user) return errorResponse;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const type = url.searchParams.get("type") || "ALL";
    const status = url.searchParams.get("status") || "ALL";
    const search = url.searchParams.get("search") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (type && type !== "ALL") filter.accountType = type;
    if (status && status !== "ALL") filter.status = status;
    if (search) {
      filter.accountNumber = { $regex: search, $options: "i" };
    }

    const total = await BankAccount.countDocuments(filter);
    const accounts = await BankAccount.find(filter)
      .populate("userId", "name email phone nationalId isVerified")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      accounts,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch accounts";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const {
      userId,
      accountType = ACCOUNT_TYPES.SAVINGS,
      initialDeposit = 0,
      dailyTransferLimit = 10000,
    } = body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Target customer not found." },
        { status: 404 }
      );
    }

    const timestampSuffix = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const accountNumber = `10${timestampSuffix}${randomSuffix}`.slice(0, 10);

    const depositAmount = Math.max(0, parseFloat(initialDeposit) || 0);

    const account = await BankAccount.create({
      accountNumber,
      userId: targetUser._id,
      accountType,
      status: ACCOUNT_STATUS.ACTIVE,
      balance: depositAmount,
      availableBalance: depositAmount,
      currency: "USD",
      dailyTransferLimit,
      minimumBalance: 50,
    });

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "ACCOUNT_CREATED",
      category: "ACCOUNT",
      details: {
        accountNumber,
        targetUserId: userId,
        accountType,
        depositAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Account #${accountNumber} (${accountType}) provisioned successfully.`,
      account,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
