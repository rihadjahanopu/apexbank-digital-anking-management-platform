import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth, hashPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { BankAccount } from "@/models/BankAccount";
import { AuditLog } from "@/models/AuditLog";
import {
  ROLES,
  USER_STATUS,
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
} from "@/lib/constants";

// GET /api/customers - List customers with filtering, search, and pagination
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
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "ALL";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { role: ROLES.CUSTOMER };

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { nationalId: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);
    const customers = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      customers,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch customers";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/customers - Staff/Admin onboards a new customer
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      nationalId,
      address,
      initialAccountType = ACCOUNT_TYPES.SAVINGS,
      initialDeposit = 50,
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required." },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already in use." },
        { status: 409 }
      );
    }

    const tempPassword = password || "BankPass123!";
    const hashedPassword = await hashPassword(tempPassword);
    const defaultPin = await hashPassword("1234");

    const newCustomer = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: ROLES.CUSTOMER,
      status: USER_STATUS.ACTIVE,
      phone,
      nationalId,
      address,
      transactionPin: defaultPin,
      isVerified: true,
    });

    // Create Initial Account
    const timestampSuffix = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const accountNumber = `10${timestampSuffix}${randomSuffix}`.slice(0, 10);

    const depositAmount = Math.max(0, parseFloat(initialDeposit) || 0);

    await BankAccount.create({
      accountNumber,
      userId: newCustomer._id,
      accountType: initialAccountType,
      status: ACCOUNT_STATUS.ACTIVE,
      balance: depositAmount,
      availableBalance: depositAmount,
      currency: "USD",
      dailyTransferLimit: 10000,
      minimumBalance: 50,
    });

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "STAFF_REGISTERED_CUSTOMER",
      category: "CUSTOMER",
      details: { customerId: newCustomer._id, customerEmail: newCustomer.email },
    });

    return NextResponse.json({
      success: true,
      message: `Customer ${newCustomer.name} created with Account #${accountNumber}.`,
      customer: newCustomer,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to register customer";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
