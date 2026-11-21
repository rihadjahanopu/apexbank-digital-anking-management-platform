import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Loan } from "@/models/Loan";
import { BankAccount } from "@/models/BankAccount";
import { Transaction } from "@/models/Transaction";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import {
  ROLES,
  LOAN_STATUS,
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
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { note = "" } = body;

    const loan = await Loan.findById(id);
    if (!loan) {
      return NextResponse.json(
        { success: false, error: "Loan application not found." },
        { status: 404 }
      );
    }

    if (loan.status === LOAN_STATUS.ACTIVE || loan.status === LOAN_STATUS.COMPLETED) {
      return NextResponse.json(
        { success: false, error: "Loan has already been approved and disbursed." },
        { status: 400 }
      );
    }

    const account = await BankAccount.findById(loan.accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Disbursement bank account not found." },
        { status: 404 }
      );
    }

    // 1. Build Repayment Installment Schedule
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schedule: any[] = [];
    for (let i = 1; i <= loan.durationMonths; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      schedule.push({
        installmentNumber: i,
        amount: loan.monthlyRepayment,
        dueDate,
        status: "PENDING",
      });
    }

    // 2. Disburse Principal Funds into Bank Account
    await BankAccount.findByIdAndUpdate(account._id, {
      $inc: {
        balance: loan.amount,
        availableBalance: loan.amount,
      },
    });

    // 3. Create Loan Disbursement Transaction
    const transactionId = `TXN-DISB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await Transaction.create({
      transactionId,
      receiverAccount: account._id,
      receiverUserId: loan.userId,
      type: TRANSACTION_TYPES.LOAN_DISBURSEMENT,
      amount: loan.amount,
      fee: 0,
      status: TRANSACTION_STATUS.COMPLETED,
      description: `Loan Disbursement: Credit facility #${loan.loanNumber}`,
      reference: loan.loanNumber,
      approvedBy: user._id,
      initiatedBy: loan.userId,
    });

    // 4. Update Loan Record
    loan.status = LOAN_STATUS.ACTIVE;
    loan.approvedBy = user._id;
    loan.disbursedAt = new Date();
    loan.repayments = schedule;
    if (note) loan.internalNotes = (loan.internalNotes ? `${loan.internalNotes}\n` : "") + `Approval note: ${note}`;
    await loan.save();

    // 5. Dispatch Notifications
    await Notification.create({
      userId: loan.userId,
      title: "Loan Approved & Disbursed!",
      message: `Your credit request of ${formatCurrency(
        loan.amount
      )} (Loan #${loan.loanNumber}) has been approved and disbursed into Account #${account.accountNumber}.`,
      type: NOTIFICATION_TYPES.LOAN_DISBURSED,
    });

    // 6. Audit Log
    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "LOAN_APPROVED_AND_DISBURSED",
      category: "LOAN",
      details: {
        loanNumber: loan.loanNumber,
        amount: loan.amount,
        accountId: account._id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Loan #${loan.loanNumber} approved and ${formatCurrency(
        loan.amount
      )} disbursed to Account #${account.accountNumber}.`,
      loan,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Loan approval failed";
    console.error("Loan approval error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
