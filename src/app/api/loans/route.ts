import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Loan } from "@/models/Loan";
import { BankAccount } from "@/models/BankAccount";
import { BankingSettings } from "@/models/BankingSettings";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import {
  ROLES,
  LOAN_TYPES,
  LOAN_STATUS,
  ACCOUNT_STATUS,
  NOTIFICATION_TYPES,
  DEFAULT_BANKING_SETTINGS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/money";

// GET /api/loans - Admin/Staff lists loans with filters
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
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (status && status !== "ALL") filter.status = status;
    if (type && type !== "ALL") filter.loanType = type;

    const total = await Loan.countDocuments(filter);
    const loans = await Loan.find(filter)
      .populate("userId", "name email phone nationalId")
      .populate("accountId", "accountNumber accountType")
      .populate("reviewedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      loans,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load loans";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/loans - Customer applies for loan
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const {
      accountId,
      loanType = LOAN_TYPES.PERSONAL,
      amount,
      durationMonths,
      monthlyIncome,
      employmentStatus,
      purpose,
    } = body;

    const principal = parseFloat(amount);
    const duration = parseInt(durationMonths, 10);
    const income = parseFloat(monthlyIncome);

    if (isNaN(principal) || principal < 100) {
      return NextResponse.json(
        { success: false, error: "Minimum loan request is $100." },
        { status: 400 }
      );
    }

    if (isNaN(duration) || duration < 1 || duration > 120) {
      return NextResponse.json(
        { success: false, error: "Loan duration must be between 1 and 120 months." },
        { status: 400 }
      );
    }

    if (isNaN(income) || income <= 0) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid monthly income." },
        { status: 400 }
      );
    }

    const account = await BankAccount.findById(accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Target account not found." },
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
        {
          success: false,
          error: "Selected account is not active. Cannot receive loan disbursement.",
        },
        { status: 400 }
      );
    }

    let settings = await BankingSettings.findOne();
    if (!settings) {
      settings = await BankingSettings.create(DEFAULT_BANKING_SETTINGS);
    }

    const interestRate = settings.loanInterestRateDefault || 7.5;
    const monthlyRate = interestRate / 100 / 12;

    // Standard Amortization Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, duration))) /
      (Math.pow(1 + monthlyRate, duration) - 1);

    const safeMonthlyRepayment = Math.round(monthlyPayment * 100) / 100;
    const totalRepayment = Math.round(safeMonthlyRepayment * duration * 100) / 100;

    const loanNumber = `LN-${Date.now().toString().slice(-6)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const newLoan = await Loan.create({
      loanNumber,
      userId: user._id,
      accountId: account._id,
      loanType,
      amount: principal,
      interestRate,
      durationMonths: duration,
      monthlyRepayment: safeMonthlyRepayment,
      totalRepayment,
      remainingBalance: totalRepayment,
      monthlyIncome: income,
      employmentStatus,
      purpose,
      status: LOAN_STATUS.PENDING,
      forwardedToAdmin: false,
      repayments: [],
    });

    await Notification.create({
      userId: user._id,
      title: "Loan Application Submitted",
      message: `Your credit request of ${formatCurrency(
        principal
      )} (Ref: ${loanNumber}) has been submitted for branch desk underwriting.`,
      type: NOTIFICATION_TYPES.SECURITY_ALERT,
    });

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "LOAN_APPLICATION_SUBMITTED",
      category: "LOAN",
      details: { loanNumber, amount: principal, durationMonths: duration },
    });

    return NextResponse.json({
      success: true,
      message: `Loan application #${loanNumber} submitted successfully.`,
      loan: newLoan,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Loan submission failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
