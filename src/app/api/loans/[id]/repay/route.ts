import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Loan } from "@/models/Loan";
import { BankAccount } from "@/models/BankAccount";
import { Transaction } from "@/models/Transaction";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import {
  LOAN_STATUS,
  ACCOUNT_STATUS,
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
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { installmentNumber, accountId } = body;

    const loan = await Loan.findById(id);
    if (!loan) {
      return NextResponse.json(
        { success: false, error: "Loan not found." },
        { status: 404 }
      );
    }

    if (loan.status !== LOAN_STATUS.ACTIVE) {
      return NextResponse.json(
        { success: false, error: `Loan is not active (current status: ${loan.status}).` },
        { status: 400 }
      );
    }

    const installment = loan.repayments.find(
      (r) => r.installmentNumber === installmentNumber
    );

    if (!installment) {
      return NextResponse.json(
        { success: false, error: "Installment item not found in schedule." },
        { status: 404 }
      );
    }

    if (installment.status === "PAID") {
      return NextResponse.json(
        { success: false, error: "This installment is already paid." },
        { status: 400 }
      );
    }

    const account = await BankAccount.findById(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Repayment bank account not found." },
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
        { success: false, error: "Account is not active." },
        { status: 400 }
      );
    }

    // Verify sufficient funds
    const available = safeSubtract(account.availableBalance, account.minimumBalance || 0);
    if (available < installment.amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient funds. Installment: ${formatCurrency(
            installment.amount
          )}, Available: ${formatCurrency(available)}.`,
        },
        { status: 400 }
      );
    }

    // 1. Debit Account
    await BankAccount.findByIdAndUpdate(account._id, {
      $inc: {
        balance: -installment.amount,
        availableBalance: -installment.amount,
      },
    });

    // 2. Create Ledger Record
    const transactionId = `TXN-REPAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await Transaction.create({
      transactionId,
      senderAccount: account._id,
      senderUserId: user._id,
      type: TRANSACTION_TYPES.LOAN_REPAYMENT,
      amount: installment.amount,
      fee: 0,
      status: TRANSACTION_STATUS.COMPLETED,
      description: `Loan Repayment: Installment #${installmentNumber} of Loan #${loan.loanNumber}`,
      reference: loan.loanNumber,
      initiatedBy: user._id,
    });

    // 3. Mark Installment Paid
    installment.status = "PAID";
    installment.paidDate = new Date();
    installment.transactionId = transactionId;

    loan.remainingBalance = Math.max(
      0,
      safeSubtract(loan.remainingBalance, installment.amount)
    );

    // If all installments paid or remaining balance is 0, complete loan
    const unpaidCount = loan.repayments.filter((r) => r.status !== "PAID").length;
    if (unpaidCount === 0 || loan.remainingBalance <= 0) {
      loan.status = LOAN_STATUS.COMPLETED;
    }

    await loan.save();

    // 4. Dispatch Notification
    await Notification.create({
      userId: user._id,
      title: "Loan Installment Paid",
      message: `Installment #${installmentNumber} of ${formatCurrency(
        installment.amount
      )} paid successfully for Loan #${loan.loanNumber}. Remaining balance: ${formatCurrency(
        loan.remainingBalance
      )}.`,
      type: NOTIFICATION_TYPES.LOAN_REPAYMENT,
    });

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "LOAN_INSTALLMENT_REPAID",
      category: "LOAN",
      details: {
        loanNumber: loan.loanNumber,
        installmentNumber,
        amount: installment.amount,
        remainingBalance: loan.remainingBalance,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Installment #${installmentNumber} (${formatCurrency(
        installment.amount
      )}) repaid successfully.`,
      loan,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Repayment processing failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
