import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Transaction } from "@/models/Transaction";
import { BankAccount } from "@/models/BankAccount";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, ACCOUNT_STATUS } from "@/lib/constants";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { action } = body; // "DISMISS" | "BLOCK_ACCOUNT"

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction record not found." },
        { status: 404 }
      );
    }

    if (action === "DISMISS") {
      transaction.isSuspicious = false;
      transaction.reviewedBy = user._id;
      await transaction.save();

      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: "SUSPICIOUS_TRANSACTION_FLAG_DISMISSED",
        category: "TRANSACTION",
        details: { transactionId: transaction.transactionId },
      });

      return NextResponse.json({
        success: true,
        message: `Risk flag dismissed for Transaction #${transaction.transactionId}.`,
      });
    } else {
      // Freeze Sender Account
      if (transaction.senderAccount) {
        await BankAccount.findByIdAndUpdate(transaction.senderAccount, {
          status: ACCOUNT_STATUS.FROZEN,
        });
      }

      transaction.reviewedBy = user._id;
      await transaction.save();

      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: "SUSPICIOUS_TRANSACTION_SENDER_FROZEN",
        category: "TRANSACTION",
        details: {
          transactionId: transaction.transactionId,
          senderAccountId: transaction.senderAccount,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Sender account frozen due to security policy on Transaction #${transaction.transactionId}.`,
      });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Review action failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
