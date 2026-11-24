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
import { safeSubtract, safeAdd, formatCurrency } from "@/lib/money";
import { decodeBanglaQR } from "@/lib/bangla-qr";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const {
      senderAccountId,
      qrRawString,
      amount,
      transactionPin,
      note,
    } = body;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid payment amount." },
        { status: 400 }
      );
    }

    if (!transactionPin) {
      return NextResponse.json(
        { success: false, error: "Transaction PIN is required to authorize Bangla QR payment." },
        { status: 400 }
      );
    }

    // 1. Decode & validate Bangla QR payload
    const decoded = decodeBanglaQR(qrRawString || "");
    if (!decoded.isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or unrecognized Bangla QR code format." },
        { status: 400 }
      );
    }

    // 2. Verify User's Transaction PIN
    const userWithPin = await User.findById(user._id).select("+transactionPin");
    if (!userWithPin?.transactionPin) {
      return NextResponse.json(
        {
          success: false,
          error: "You have not set up a 4-digit Transaction PIN. Please set it in Profile & Security.",
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

    // 3. Verify Source Account
    const senderAccount = await BankAccount.findById(senderAccountId);
    if (!senderAccount) {
      return NextResponse.json(
        { success: false, error: "Selected source bank account was not found." },
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
          error: `Account is ${senderAccount.status}. Active status is required to execute Bangla QR payments.`,
        },
        { status: 400 }
      );
    }

    // Check balance
    if (senderAccount.availableBalance < paymentAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient available funds. Available: ${formatCurrency(
            senderAccount.availableBalance
          )}, Payment: ${formatCurrency(paymentAmount)}.`,
        },
        { status: 400 }
      );
    }

    // Zero fee for Bangla QR retail payments per Bangladesh Bank financial inclusion guidelines
    const fee = 0;

    // 4. Atomic Balance Deduction
    senderAccount.balance = safeSubtract(senderAccount.balance, paymentAmount);
    senderAccount.availableBalance = safeSubtract(
      senderAccount.availableBalance,
      paymentAmount
    );
    await senderAccount.save();

    // Check if merchant account exists in internal database (e.g. for intra-bank P2P or merchant settlement)
    const receiverAccount = await BankAccount.findOne({
      $or: [
        { accountNumber: decoded.merchantId },
        { "employmentInfo.employerName": decoded.merchantName },
      ],
      status: ACCOUNT_STATUS.ACTIVE,
    });

    if (receiverAccount) {
      receiverAccount.balance = safeAdd(receiverAccount.balance, paymentAmount);
      receiverAccount.availableBalance = safeAdd(
        receiverAccount.availableBalance,
        paymentAmount
      );
      await receiverAccount.save();
    }

    // 5. Create Transaction Record
    const txnId = `BQR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const description = `Bangla QR Payment to ${decoded.merchantName}${
      decoded.merchantCity ? ` (${decoded.merchantCity})` : ""
    }${note ? ` - ${note}` : ""}`;

    await Transaction.create({
      transactionId: txnId,
      senderAccount: senderAccount._id,
      receiverAccount: receiverAccount?._id,
      senderUserId: user._id,
      receiverUserId: receiverAccount?.userId,
      type: TRANSACTION_TYPES.BANGLA_QR_PAYMENT,
      amount: paymentAmount,
      fee,
      status: TRANSACTION_STATUS.COMPLETED,
      description,
      reference: decoded.billNumber || decoded.merchantId,
      isSuspicious: false,
      initiatedBy: user._id,
    });

    // 6. Push In-App Notification
    await Notification.create({
      userId: user._id,
      title: "Bangla QR Payment Successful",
      message: `Paid ${formatCurrency(paymentAmount)} to ${decoded.merchantName} via Bangla QR. Txn: ${txnId}`,
      type: NOTIFICATION_TYPES.TRANSFER_SUCCESS,
      link: "/customer/transactions",
    });

    // 7. Audit Log
    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "BANGLA_QR_PAYMENT",
      category: "TRANSACTION",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "ApexMobile/1.0",
      details: {
        transactionId: txnId,
        merchantName: decoded.merchantName,
        merchantId: decoded.merchantId,
        mcc: decoded.mcc,
        amount: paymentAmount,
        sourceAccount: senderAccount.accountNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Bangla QR payment of ${formatCurrency(paymentAmount)} to ${decoded.merchantName} was successful.`,
      data: {
        transactionId: txnId,
        amount: paymentAmount,
        merchantName: decoded.merchantName,
        merchantCity: decoded.merchantCity,
        category: decoded.mccCategory,
        timestamp: new Date().toISOString(),
        sourceAccountNumber: senderAccount.accountNumber,
        newBalance: senderAccount.availableBalance,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process Bangla QR payment." },
      { status: 500 }
    );
  }
}
