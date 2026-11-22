import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { DepositRequest } from "@/models/DepositRequest";
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
import { formatCurrency } from "@/lib/money";

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

    const request = await DepositRequest.findById(id);
    if (!request) {
      return NextResponse.json(
        { success: false, error: "Deposit request not found." },
        { status: 404 }
      );
    }

    if (request.status !== REQUEST_STATUS.PENDING) {
      return NextResponse.json(
        {
          success: false,
          error: `Deposit request is already ${request.status.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    // Customer cannot approve their own deposit request
    if (request.userId.toString() === user._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Staff cannot approve their own deposit requests." },
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
      // 1. Credit Account Balance
      await BankAccount.findByIdAndUpdate(account._id, {
        $inc: {
          balance: request.amount,
          availableBalance: request.amount,
        },
      });

      // 2. Create Ledger Transaction Record
      const transactionId = `TXN-DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await Transaction.create({
        transactionId,
        receiverAccount: account._id,
        receiverUserId: request.userId,
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: request.amount,
        fee: 0,
        status: TRANSACTION_STATUS.COMPLETED,
        description: `Approved Branch Deposit: ${request.description || "Direct Deposit"}`,
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
        title: "Deposit Request Approved",
        message: `Your deposit of ${formatCurrency(
          request.amount
        )} has been approved and credited to Account #${account.accountNumber}.`,
        type: NOTIFICATION_TYPES.DEPOSIT_APPROVED,
      });

      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: "DEPOSIT_REQUEST_APPROVED",
        category: "TRANSACTION",
        details: { requestId: id, amount: request.amount, accountId: account._id },
      });

      return NextResponse.json({
        success: true,
        message: `Deposit of ${formatCurrency(request.amount)} approved and credited.`,
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
        title: "Deposit Request Rejected",
        message: `Your deposit request for ${formatCurrency(
          request.amount
        )} was rejected. Reason: ${note || "Does not meet verification standards."}`,
        type: NOTIFICATION_TYPES.DEPOSIT_REJECTED,
      });

      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: "DEPOSIT_REQUEST_REJECTED",
        category: "TRANSACTION",
        details: { requestId: id, reason: note },
      });

      return NextResponse.json({
        success: true,
        message: "Deposit request rejected without modifying balance.",
      });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Deposit review failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
