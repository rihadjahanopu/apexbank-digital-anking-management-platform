import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Transaction } from "@/models/Transaction";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !user) return errorResponse;

    const transactions = await Transaction.find({ isSuspicious: true })
      .populate("senderAccount", "accountNumber accountType")
      .populate("receiverAccount", "accountNumber accountType")
      .populate("senderUserId", "name email phone")
      .populate("receiverUserId", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      transactions,
      total: transactions.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load suspicious transactions";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
