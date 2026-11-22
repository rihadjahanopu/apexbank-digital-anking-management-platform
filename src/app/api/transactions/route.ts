import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Transaction } from "@/models/Transaction";
import { BankAccount } from "@/models/BankAccount";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "15", 10);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const accountId = url.searchParams.get("accountId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // Customer can only view their own transactions
    if (user.role === ROLES.CUSTOMER) {
      const myAccounts = await BankAccount.find({ userId: user._id }).select("_id");
      const myAccountIds = myAccounts.map((a) => a._id);
      filter.$or = [
        { senderAccount: { $in: myAccountIds } },
        { receiverAccount: { $in: myAccountIds } },
      ];
    } else if (accountId) {
      filter.$or = [
        { senderAccount: accountId },
        { receiverAccount: accountId },
      ];
    }

    if (type && type !== "ALL") filter.type = type;
    if (status && status !== "ALL") filter.status = status;

    if (search) {
      filter.$or = filter.$or
        ? [
            ...filter.$or,
            { transactionId: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ]
        : [
            { transactionId: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .populate("senderAccount", "accountNumber accountType")
      .populate("receiverAccount", "accountNumber accountType")
      .populate("senderUserId", "name email")
      .populate("receiverUserId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load transactions";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
