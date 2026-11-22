import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { BankAccount } from "@/models/BankAccount";
import { Transaction } from "@/models/Transaction";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import {
  ROLES,
  REQUEST_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  NOTIFICATION_TYPES,
} from "@/lib/constants";
import { formatCurrency, safeSubtract } from "@/lib/money";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { action, note = "" } = body; // action: "APPROVE" | "REJECT"

    const request = await WithdrawalRequest.findById(id);
    if (!request) {
      return NextResponse.json(
        { success: false, error: "Withdrawal request not found." },
        { status: 404 }
      );
    }

    if (request.status !== REQUEST_STATUS.PENDING) {
      return NextResponse.json(
        {
          success: false,
          error: `Withdrawal request is already ${request.status.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    // Staff cannot approve their own withdrawal request
    if (request.userId.toString() === user._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Staff cannot approve their own withdrawal requests." },
        { status: 403 }
      );
    }

    const account = await BankAccount.findById(request.accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Depository bank account not found." },
        { status: 404 }
      );
    }

    if (action === "APPROVE") {
      // Check sufficient funds at moment of approval
      const effectiveAvailable = safeSubtract(
        account.availableBalance,
        account.minimumBalance || 0
      );
      if (effectiveAvailable < request.amount) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot approve withdrawal: Account balance is now insufficient (${formatCurrency(
              effectiveAvailable
            )} available).`,
          },
          { status: 400 }
        );
      }

      // 1. Debit Account Balance
      await BankAccount.findByIdAndUpdate(account._id, {
        $inc: {
          balance: -request.amount,
          availableBalance: -request.amount,
        },
      });

      // 2. Create Ledger Transaction Record
      const transactionId = `TXN-WTH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await Transaction.create({
        transactionId,
        senderAccount: account._id,
        senderUserId: request.userId,
        type: TRANSACTION_TYPES.WITHDRAWAL,
        amount: request.amount,
        fee: 0,
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Approved Branch Cash Withdrawal: ${request.description || "Counter Withdrawal"}`,
        approvedBy: user._id,
        initiatedBy: request.userId,
      });

      request.status = REQUEST_STATUS.APPROVED;
      request.reviewedBy = user._id;
      request.reviewedAt = new Date();
      request.adminNote = note;
      await request.save();

      // 3. Dispatch Notification
      await Notification.create({
        userId: request.userId,
        title: "Withdrawal Request Approved",
        message: `Your withdrawal of ${formatCurrency(
          request.amount
        )} has been approved. Funds disbursed from Account #${account.accountNumber}.`,
        type: NOTIFICATION_TYPES.WITHDRAWAL_APPROVED,
      });

      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: "WITHDRAWAL_REQUEST_APPROVED",
        category: "TRANSACTION",
        details: { requestId: id, amount: request.amount, accountId: account._id },
      });

      return NextResponse.json({
        success: true,
        message: `Withdrawal of ${formatCurrency(request.amount)} approved and debited.`,
      });
    } else {
      // Rejection
      request.status = REQUEST_STATUS.REJECTED;
      request.reviewedBy = user._id;
      request.reviewedAt = new Date();
      request.adminNote = note;
      await request.save();

      await Notification.create({
        userId: request.userId,
        title: "Withdrawal Request Rejected",
        message: `Your withdrawal request for ${formatCurrency(
          request.amount
        )} was rejected. Reason: ${note || "Verification criteria not met."}`,
        type: NOTIFICATION_TYPES.WITHDRAWAL_REJECTED,
      });

      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: "WITHDRAWAL_REQUEST_REJECTED",
        category: "TRANSACTION",
        details: { requestId: id, reason: note },
      });

      return NextResponse.json({
        success: true,
        message: "Withdrawal request rejected without modifying balance.",
      });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Withdrawal review failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
