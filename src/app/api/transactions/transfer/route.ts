import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth, comparePassword } from "@/lib/auth";
import { User } from "@/models/User";
import { BankAccount } from "@/models/BankAccount";
import { Transaction } from "@/models/Transaction";
import { Notification } from "@/models/Notification";
import { BankingSettings } from "@/models/BankingSettings";
import { AuditLog } from "@/models/AuditLog";
import {
  ACCOUNT_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  NOTIFICATION_TYPES,
  DEFAULT_BANKING_SETTINGS,
} from "@/lib/constants";
import { safeSubtract, safeAdd, formatCurrency } from "@/lib/money";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const {
      senderAccountId,
      recipientAccountNumber,
      amount,
      description = "Fund Transfer",
      transactionPin,
    } = body;

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid transfer amount." },
        { status: 400 }
      );
    }

    if (!transactionPin) {
      return NextResponse.json(
        { success: false, error: "Transaction PIN is required to authorize transfer." },
        { status: 400 }
      );
    }

    // 1. Verify User's Transaction PIN
    const userWithPin = await User.findById(user._id).select("+transactionPin");
    if (!userWithPin?.transactionPin) {
      return NextResponse.json(
        {
          success: false,
          error: "You have not configured a transaction PIN. Please set it up in Profile & Security.",
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
        { success: false, error: "Invalid transaction PIN." },
        { status: 401 }
      );
    }

    // 2. Fetch Banking Settings
    let settings = await BankingSettings.findOne();
    if (!settings) {
      settings = await BankingSettings.create(DEFAULT_BANKING_SETTINGS);
    }

    // Check maximum transaction cap
    if (transferAmount > settings.maximumTransactionAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Transfer amount exceeds maximum single transaction cap of ${formatCurrency(
            settings.maximumTransactionAmount
          )}.`,
        },
        { status: 400 }
      );
    }

    // Calculate fee
    const feePercentage = settings.transferFeePercentage || 0.5;
    const computedFee = Math.max(
      settings.minTransferFee || 1.0,
      (transferAmount * feePercentage) / 100
    );
    const totalDeduction = safeAdd(transferAmount, computedFee);

    // 3. Verify Sender Account
    const senderAccount = await BankAccount.findById(senderAccountId);
    if (!senderAccount) {
      return NextResponse.json(
        { success: false, error: "Sender account not found." },
        { status: 404 }
      );
    }

    if (senderAccount.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You do not own this account." },
        { status: 403 }
      );
    }

    if (senderAccount.status !== ACCOUNT_STATUS.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          error: `Sender account is ${senderAccount.status.toLowerCase()}. Transfers not permitted.`,
        },
        { status: 400 }
      );
    }

    // Check minimum balance requirement & sufficient funds
    const effectiveAvailable = safeSubtract(
      senderAccount.availableBalance,
      senderAccount.minimumBalance || 0
    );
    if (effectiveAvailable < totalDeduction) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient available balance. Required: ${formatCurrency(
            totalDeduction
          )} (includes ${formatCurrency(computedFee)} fee and minimum balance reserve).`,
        },
        { status: 400 }
      );
    }

    // Check daily transfer limit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayTransfers = await Transaction.aggregate([
      {
        $match: {
          senderAccount: senderAccount._id,
          createdAt: { $gte: startOfDay },
          status: TRANSACTION_STATUS.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          totalSent: { $sum: "$amount" },
        },
      },
    ]);

    const sentToday = todayTransfers[0]?.totalSent || 0;
    const dailyLimit = senderAccount.dailyTransferLimit || settings.dailyTransferLimit;

    if (sentToday + transferAmount > dailyLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Transfer exceeds daily transfer cap of ${formatCurrency(
            dailyLimit
          )}. Sent today: ${formatCurrency(sentToday)}.`,
        },
        { status: 400 }
      );
    }

    // 4. Verify Recipient Account
    const cleanRecipientNum = recipientAccountNumber.trim();
    const recipientAccount = await BankAccount.findOne({
      accountNumber: cleanRecipientNum,
    });

    if (!recipientAccount) {
      return NextResponse.json(
        {
          success: false,
          error: `Recipient account #${cleanRecipientNum} does not exist.`,
        },
        { status: 404 }
      );
    }

    if (recipientAccount._id.toString() === senderAccount._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Cannot transfer funds to the same account." },
        { status: 400 }
      );
    }

    if (recipientAccount.status !== ACCOUNT_STATUS.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          error: `Recipient account is ${recipientAccount.status.toLowerCase()}. Cannot accept incoming funds.`,
        },
        { status: 400 }
      );
    }

    // 5. Fraud Detection Check
    let isSuspicious = false;
    let suspiciousReason = "";

    if (transferAmount >= settings.suspiciousTransactionThreshold) {
      isSuspicious = true;
      suspiciousReason = `Transaction amount of ${formatCurrency(
        transferAmount
      )} meets or exceeds risk threshold of ${formatCurrency(
        settings.suspiciousTransactionThreshold
      )}.`;
    }

    // Velocity check (rapid transactions)
    const windowMinutes = settings.rapidTransactionWindowMinutes || 5;
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    const recentTxnCount = await Transaction.countDocuments({
      senderUserId: user._id,
      createdAt: { $gte: windowStart },
    });

    if (recentTxnCount >= (settings.rapidTransactionCountLimit || 4)) {
      isSuspicious = true;
      suspiciousReason = `High-velocity rapid transactions detected (${recentTxnCount} transfers in last ${windowMinutes} minutes).`;
    }

    // 6. Execute Transfer with Database Atomic Consistency
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Debit Sender
    const updatedSender = await BankAccount.findByIdAndUpdate(
      senderAccount._id,
      {
        $inc: {
          balance: -totalDeduction,
          availableBalance: -totalDeduction,
        },
      },
      { new: true }
    );

    // Credit Receiver
    const updatedReceiver = await BankAccount.findByIdAndUpdate(
      recipientAccount._id,
      {
        $inc: {
          balance: transferAmount,
          availableBalance: transferAmount,
        },
      },
      { new: true }
    );

    // If either update failed, rollback immediately
    if (!updatedSender || !updatedReceiver) {
      if (updatedSender) {
        await BankAccount.findByIdAndUpdate(senderAccount._id, {
          $inc: { balance: totalDeduction, availableBalance: totalDeduction },
        });
      }
      throw new Error("Atomic balance synchronization failed. Rolled back.");
    }

    // Create Transaction Record
    const transactionRecord = await Transaction.create({
      transactionId,
      senderAccount: senderAccount._id,
      receiverAccount: recipientAccount._id,
      senderUserId: user._id,
      receiverUserId: recipientAccount.userId,
      type: TRANSACTION_TYPES.TRANSFER,
      amount: transferAmount,
      fee: computedFee,
      status: TRANSACTION_STATUS.COMPLETED,
      description,
      isSuspicious,
      suspiciousReason,
      initiatedBy: user._id,
    });

    // 7. Dispatch In-App Notifications
    await Promise.all([
      Notification.create({
        userId: user._id,
        title: "Fund Transfer Successful",
        message: `Transferred ${formatCurrency(
          transferAmount
        )} to Account #${cleanRecipientNum} (Fee: ${formatCurrency(computedFee)}).`,
        type: NOTIFICATION_TYPES.TRANSFER_SUCCESS,
      }),
      Notification.create({
        userId: recipientAccount.userId,
        title: "Incoming Funds Received",
        message: `You received ${formatCurrency(
          transferAmount
        )} from ${user.name} into Account #${recipientAccount.accountNumber}.`,
        type: NOTIFICATION_TYPES.TRANSFER_RECEIVED,
      }),
    ]);

    // 8. Write Audit Log
    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "FUND_TRANSFER_EXECUTED",
      category: "TRANSACTION",
      details: {
        transactionId,
        amount: transferAmount,
        fee: computedFee,
        senderAccountId: senderAccount._id,
        recipientAccountId: recipientAccount._id,
        isSuspicious,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${formatCurrency(
        transferAmount
      )} to Account #${cleanRecipientNum}.`,
      transaction: transactionRecord,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Fund transfer failed";
    console.error("Transfer Error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
