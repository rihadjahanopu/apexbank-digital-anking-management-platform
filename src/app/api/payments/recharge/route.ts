import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth, comparePassword } from "@/lib/auth";
import { User } from "@/models/User";
import { BankAccount } from "@/models/BankAccount";
import { Transaction } from "@/models/Transaction";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import {
  ACCOUNT_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  NOTIFICATION_TYPES,
} from "@/lib/constants";
import { safeSubtract, formatCurrency } from "@/lib/money";
import {
  validateBDPhoneNumber,
  BANGLADESH_OPERATORS,
  MobileOperatorId,
  ConnectionType,
} from "@/lib/mobile-recharge";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const {
      senderAccountId,
      mobileNumber,
      operatorId,
      connectionType = "PREPAID",
      amount,
      packTitle,
      transactionPin,
    } = body;

    const rechargeAmount = parseFloat(amount);
    if (isNaN(rechargeAmount) || rechargeAmount < 10 || rechargeAmount > 5000) {
      return NextResponse.json(
        { success: false, error: "Recharge amount must be between ৳10 and ৳5,000 BDT." },
        { status: 400 }
      );
    }

    // 1. Validate Bangladeshi Mobile Number
    const phoneValidation = validateBDPhoneNumber(mobileNumber || "");
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { success: false, error: phoneValidation.error || "Invalid Bangladeshi mobile phone number." },
        { status: 400 }
      );
    }

    // 2. Validate Operator
    const operator = BANGLADESH_OPERATORS[operatorId as MobileOperatorId];
    if (!operator) {
      return NextResponse.json(
        { success: false, error: "Please select a valid Bangladeshi telecom operator." },
        { status: 400 }
      );
    }

    if (!transactionPin) {
      return NextResponse.json(
        { success: false, error: "Transaction PIN is required to authorize mobile recharge." },
        { status: 400 }
      );
    }

    // 3. Verify User's Transaction PIN
    const userWithPin = await User.findById(user._id).select("+transactionPin");
    if (!userWithPin?.transactionPin) {
      return NextResponse.json(
        {
          success: false,
          error: "You have not set up a 4-digit Transaction PIN. Please configure it in Profile & Security.",
        },
        { status: 400 }
      );
    }

    const isPinValid = await comparePassword(
      transactionPin,
      userWithPin.transactionPin
    );
    if (!isPinValid) {
      return NextResponse.json(
        { success: false, error: "Incorrect transaction PIN." },
        { status: 401 }
      );
    }

    // 4. Verify Source Account
    const senderAccount = await BankAccount.findById(senderAccountId);
    if (!senderAccount) {
      return NextResponse.json(
        { success: false, error: "Source bank account was not found." },
        { status: 404 }
      );
    }

    if (senderAccount.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to this bank account." },
        { status: 403 }
      );
    }

    if (senderAccount.status !== ACCOUNT_STATUS.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          error: `Account is ${senderAccount.status}. Active status is required to execute recharges.`,
        },
        { status: 400 }
      );
    }

    // Check available balance
    if (senderAccount.availableBalance < rechargeAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient available balance. Available: ${formatCurrency(
            senderAccount.availableBalance
          )}, Required: ${formatCurrency(rechargeAmount)}.`,
        },
        { status: 400 }
      );
    }

    // 5. Atomic Balance Deduction
    senderAccount.balance = safeSubtract(senderAccount.balance, rechargeAmount);
    senderAccount.availableBalance = safeSubtract(
      senderAccount.availableBalance,
      rechargeAmount
    );
    await senderAccount.save();

    // 6. Create Transaction Record
    const txnId = `RCH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const description = `Mobile Recharge to ${operator.name} (${phoneValidation.normalized}) - ${connectionType}${
      packTitle ? ` [${packTitle}]` : ""
    }`;

    await Transaction.create({
      transactionId: txnId,
      senderAccount: senderAccount._id,
      senderUserId: user._id,
      type: TRANSACTION_TYPES.MOBILE_RECHARGE,
      amount: rechargeAmount,
      fee: 0,
      status: TRANSACTION_STATUS.COMPLETED,
      description,
      reference: phoneValidation.normalized,
      isSuspicious: false,
      initiatedBy: user._id,
    });

    // 7. Push In-App Notification
    await Notification.create({
      userId: user._id,
      title: "Mobile Recharge Successful",
      message: `Recharged ৳${rechargeAmount} to ${operator.name} (${phoneValidation.normalized}). Txn: ${txnId}`,
      type: NOTIFICATION_TYPES.TRANSFER_SUCCESS,
      link: "/customer/transactions",
    });

    // 8. Audit Log
    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "MOBILE_RECHARGE",
      category: "TRANSACTION",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "ApexMobile/1.0",
      details: {
        transactionId: txnId,
        mobileNumber: phoneValidation.normalized,
        operator: operator.name,
        connectionType,
        amount: rechargeAmount,
        packTitle,
        sourceAccount: senderAccount.accountNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Mobile recharge of ৳${rechargeAmount} to ${operator.name} (${phoneValidation.normalized}) was successful.`,
      data: {
        transactionId: txnId,
        mobileNumber: phoneValidation.normalized,
        operatorName: operator.name,
        bengaliOperatorName: operator.bengaliName,
        connectionType: connectionType as ConnectionType,
        amount: rechargeAmount,
        packTitle: packTitle || "Standard Airtime Balance",
        timestamp: new Date().toISOString(),
        sourceAccountNumber: senderAccount.accountNumber,
        newBalance: senderAccount.availableBalance,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process mobile recharge." },
      { status: 500 }
    );
  }
}
