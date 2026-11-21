import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/User";
import { BankAccount } from "@/models/BankAccount";
import { Transaction } from "@/models/Transaction";
import { DepositRequest } from "@/models/DepositRequest";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { Loan } from "@/models/Loan";
import {
  ROLES,
  REQUEST_STATUS,
  LOAN_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
} from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    // Parallel aggregate count metrics
    const [
      totalCustomers,
      totalBankAccounts,
      accountsSummary,
      transactionsSummary,
      pendingDepositRequests,
      pendingWithdrawalRequests,
      pendingLoanApplications,
      activeLoans,
      suspiciousTransactions,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.CUSTOMER }),
      BankAccount.countDocuments(),
      BankAccount.aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: "$balance" },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: { status: TRANSACTION_STATUS.COMPLETED },
        },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      DepositRequest.countDocuments({ status: REQUEST_STATUS.PENDING }),
      WithdrawalRequest.countDocuments({ status: REQUEST_STATUS.PENDING }),
      Loan.countDocuments({
        status: { $in: [LOAN_STATUS.PENDING, LOAN_STATUS.UNDER_REVIEW] },
      }),
      Loan.countDocuments({ status: LOAN_STATUS.ACTIVE }),
      Transaction.countDocuments({ isSuspicious: true }),
    ]);

    const totalBankBalance = accountsSummary[0]?.totalBalance || 0;

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalTransactions = 0;

    transactionsSummary.forEach((item) => {
      totalTransactions += item.count;
      if (item._id === TRANSACTION_TYPES.DEPOSIT) {
        totalDeposits += item.totalAmount;
      } else if (item._id === TRANSACTION_TYPES.WITHDRAWAL) {
        totalWithdrawals += item.totalAmount;
      }
    });

    // Monthly Volume Aggregation (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyAggregation = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: TRANSACTION_STATUS.COMPLETED,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Build timeline for last 6 months
    const monthlyVolumeMap: Record<string, { volume: number; count: number }> =
      {};
    const depositsVsWithdrawalsMap: Record<
      string,
      { deposits: number; withdrawals: number }
    > = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyVolumeMap[label] = { volume: 0, count: 0 };
      depositsVsWithdrawalsMap[label] = { deposits: 0, withdrawals: 0 };
    }

    monthlyAggregation.forEach((item) => {
      const label = `${monthNames[item._id.month - 1]} ${item._id.year.toString().slice(-2)}`;
      if (monthlyVolumeMap[label]) {
        monthlyVolumeMap[label].volume += item.total;
        monthlyVolumeMap[label].count += item.count;
      }
      if (depositsVsWithdrawalsMap[label]) {
        if (item._id.type === TRANSACTION_TYPES.DEPOSIT) {
          depositsVsWithdrawalsMap[label].deposits += item.total;
        } else if (item._id.type === TRANSACTION_TYPES.WITHDRAWAL) {
          depositsVsWithdrawalsMap[label].withdrawals += item.total;
        }
      }
    });

    const monthlyVolume = Object.entries(monthlyVolumeMap).map(
      ([month, data]) => ({
        month,
        volume: data.volume,
        count: data.count,
      })
    );

    const depositsVsWithdrawals = Object.entries(depositsVsWithdrawalsMap).map(
      ([month, data]) => ({
        month,
        deposits: data.deposits,
        withdrawals: data.withdrawals,
      })
    );

    // Account distribution by type
    const accountDistributionAgg = await BankAccount.aggregate([
      {
        $group: {
          _id: "$accountType",
          count: { $sum: 1 },
        },
      },
    ]);

    const accountDistribution = accountDistributionAgg.map((acc) => ({
      name: `${acc._id} Accounts`,
      value: acc.count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        totalBankAccounts,
        totalBankBalance,
        totalDeposits,
        totalWithdrawals,
        totalTransactions,
        pendingDepositRequests,
        pendingWithdrawalRequests,
        pendingLoanApplications,
        activeLoans,
        suspiciousTransactions,
        monthlyVolume,
        depositsVsWithdrawals,
        accountDistribution,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Dashboard aggregation failed";
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
