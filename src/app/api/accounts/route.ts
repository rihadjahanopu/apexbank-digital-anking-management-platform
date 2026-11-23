import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { BankAccount } from "@/models/BankAccount";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { Transaction } from "@/models/Transaction";
import {
  ROLES,
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
  USER_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
} from "@/lib/constants";

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
    const type = url.searchParams.get("type") || "ALL";
    const status = url.searchParams.get("status") || "ALL";
    const search = url.searchParams.get("search") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (type && type !== "ALL") filter.accountType = type;
    if (status && status !== "ALL") filter.status = status;
    if (search) {
      filter.accountNumber = { $regex: search, $options: "i" };
    }

    const total = await BankAccount.countDocuments(filter);
    const accounts = await BankAccount.find(filter)
      .populate("userId", "name email phone nationalId isVerified")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      accounts,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch accounts";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
      ROLES.CUSTOMER,
    ]);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const {
      userId,
      isNewCustomer,
      newCustomerData,
      accountType = ACCOUNT_TYPES.SAVINGS,
      currency = "USD",
      branchName = "Main Financial Center Branch",
      initialDeposit = 0,
      dailyTransferLimit = 10000,
      minimumBalance = 50,
      nominee,
      employmentInfo,
      services,
      signatureUrl,
      kycSnapshot,
    } = body;

    let targetUser = null;

    // 1. Resolve Target Customer
    if (user.role === ROLES.CUSTOMER) {
      targetUser = await User.findById(user._id);
    } else if (isNewCustomer && newCustomerData) {
      // Validate customer data
      const existingUser = await User.findOne({
        email: newCustomerData.email.toLowerCase().trim(),
      });
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: "A customer account with this email already exists.",
          },
          { status: 400 }
        );
      }

      const defaultPassword =
        newCustomerData.password || "CustomerTemp2026!";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      targetUser = await User.create({
        name: newCustomerData.name.trim(),
        email: newCustomerData.email.toLowerCase().trim(),
        password: hashedPassword,
        phone: newCustomerData.phone?.trim() || "",
        nationalId: newCustomerData.nationalId?.trim() || "",
        address: newCustomerData.address?.trim() || "",
        role: ROLES.CUSTOMER,
        status: USER_STATUS.ACTIVE,
        isVerified: true, // Officer onboarding at branch verifies KYC
      });
    } else {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "Customer ID is required." },
          { status: 400 }
        );
      }
      targetUser = await User.findById(userId);
    }

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Target customer could not be located." },
        { status: 404 }
      );
    }

    // 2. Generate Account Numbers & International Banking Codes
    const timestampSuffix = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const accountNumber = `10${timestampSuffix}${randomSuffix}`.slice(0, 10);
    const routingNumber = "026007491";
    const swiftBic = "AGBKUS33";
    const iban = `US79AGBK026007491${accountNumber}`;

    const depositAmount = Math.max(0, parseFloat(initialDeposit.toString()) || 0);
    const transferLimit = Math.max(
      100,
      parseFloat(dailyTransferLimit.toString()) || 10000
    );
    const minBalance = Math.max(
      0,
      parseFloat(minimumBalance.toString()) || 50
    );

    const isCustomerOpening = user.role === ROLES.CUSTOMER;
    const initialStatus = isCustomerOpening
      ? ACCOUNT_STATUS.PENDING
      : ACCOUNT_STATUS.ACTIVE;

    // 3. Create the Bank Account Record
    const account = await BankAccount.create({
      accountNumber,
      userId: targetUser._id,
      accountType,
      status: initialStatus,
      balance: depositAmount,
      availableBalance: isCustomerOpening ? 0 : depositAmount,
      currency: currency.toUpperCase(),
      branchName: branchName.trim(),
      routingNumber,
      swiftBic,
      iban,
      dailyTransferLimit: transferLimit,
      minimumBalance: minBalance,
      nominee: nominee || undefined,
      employmentInfo: employmentInfo || undefined,
      services: services || {
        debitCardRequested: true,
        chequeBookRequested: false,
        smsAlerts: true,
        eStatement: true,
      },
      signatureUrl: signatureUrl || undefined,
      kycSnapshot: kycSnapshot || undefined,
    });

    // 4. Record Initial Deposit Transaction if deposit > 0
    if (depositAmount > 0) {
      const txTimestamp = Date.now().toString().slice(-8);
      const txRandom = Math.floor(1000 + Math.random() * 9000);
      const transactionId = `TXN-OPEN-${txTimestamp}-${txRandom}`;

      await Transaction.create({
        transactionId,
        receiverAccount: account._id,
        receiverUserId: targetUser._id,
        type: TRANSACTION_TYPES.DEPOSIT,
        amount: depositAmount,
        fee: 0,
        status: isCustomerOpening
          ? TRANSACTION_STATUS.PENDING
          : TRANSACTION_STATUS.COMPLETED,
        description: isCustomerOpening
          ? `Initial Opening Depository Deposit (Pending Staff Review) #${accountNumber}`
          : `Initial Depository Credit for Account Opening #${accountNumber}`,
        reference: `OPENING-DEP-${accountNumber}`,
        isSuspicious: false,
        initiatedBy: user._id,
        approvedBy: isCustomerOpening ? undefined : user._id,
      });
    }

    // 5. System Audit Trail
    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: isCustomerOpening
        ? "ACCOUNT_APPLICATION_SUBMITTED_FOR_REVIEW"
        : "ACCOUNT_CREATED",
      category: "ACCOUNT",
      details: {
        accountNumber,
        iban,
        targetUserId: targetUser._id,
        accountType,
        depositAmount,
        branchName,
        status: initialStatus,
        verifiedViaOcr: !!kycSnapshot?.verifiedViaOcr,
      },
    });

    return NextResponse.json({
      success: true,
      message: isCustomerOpening
        ? `Depository application #${accountNumber} submitted for bank staff review.`
        : `Depository Vault #${accountNumber} (${accountType}) successfully provisioned and activated!`,
      account,
      credentials: {
        accountNumber,
        iban,
        routingNumber,
        swiftBic,
        currency,
        accountType,
        holderName: targetUser.name,
        holderEmail: targetUser.email,
        branchName,
        initialDeposit: depositAmount,
        status: initialStatus,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to open account";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
