import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/User";
import { DepositRequest } from "@/models/DepositRequest";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { Loan } from "@/models/Loan";
import { Transaction } from "@/models/Transaction";
import { ROLES, REQUEST_STATUS, LOAN_STATUS } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !user) return errorResponse;

    const [
      pendingVerifications,
      pendingDeposits,
      pendingWithdrawals,
      pendingLoans,
      totalCustomersAssigned,
      recentTransactions,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.CUSTOMER, isVerified: false }),
      DepositRequest.countDocuments({ status: REQUEST_STATUS.PENDING }),
      WithdrawalRequest.countDocuments({ status: REQUEST_STATUS.PENDING }),
      Loan.countDocuments({
        status: { $in: [LOAN_STATUS.PENDING, LOAN_STATUS.UNDER_REVIEW] },
      }),
      User.countDocuments({ role: ROLES.CUSTOMER }),
      Transaction.find()
        .populate("senderAccount", "accountNumber accountType")
        .populate("receiverAccount", "accountNumber accountType")
        .populate("senderUserId", "name")
        .populate("receiverUserId", "name")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pendingVerifications,
        pendingDeposits,
        pendingWithdrawals,
        pendingLoans,
        totalCustomersAssigned,
        recentTransactions,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Staff dashboard load failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
