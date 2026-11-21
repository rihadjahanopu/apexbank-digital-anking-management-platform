import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { BankAccount } from "@/models/BankAccount";
import { AuditLog } from "@/models/AuditLog";
import { registerSchema } from "@/lib/validations/auth";
import { hashPassword, signToken } from "@/lib/auth";
import {
  ROLES,
  USER_STATUS,
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
} from "@/lib/constants";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || "Invalid input data",
        },
        { status: 400 }
      );
    }

    const { name, email, password, phone, nationalId, address } =
      parseResult.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email address already exists.",
        },
        { status: 409 }
      );
    }

    // First registered user becomes Admin automatically if no Admin exists
    const totalUsers = await User.countDocuments();
    const role = totalUsers === 0 ? ROLES.ADMIN : ROLES.CUSTOMER;

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      status: USER_STATUS.ACTIVE,
      phone,
      nationalId,
      address,
      isVerified: role === ROLES.ADMIN, // Admins auto-verified
    });

    // If Customer, automatically provision an initial primary savings account
    let primaryAccount = null;
    if (role === ROLES.CUSTOMER) {
      const timestampSuffix = Date.now().toString().slice(-6);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const accountNumber = `10${timestampSuffix}${randomSuffix}`.slice(0, 10);

      primaryAccount = await BankAccount.create({
        accountNumber,
        userId: user._id,
        accountType: ACCOUNT_TYPES.SAVINGS,
        status: ACCOUNT_STATUS.ACTIVE,
        balance: 100.0, // Welcome deposit credit
        availableBalance: 100.0,
        currency: "USD",
        dailyTransferLimit: 10000,
        minimumBalance: 50,
      });
    }

    // Sign JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Audit Log
    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "USER_REGISTERED",
      category: "AUTH",
      details: {
        role: user.role,
        hasAccountCreated: !!primaryAccount,
      },
    });

    const userResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      address: user.address,
      nationalId: user.nationalId,
      transactionPinSet: false,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      message:
        role === ROLES.ADMIN
          ? "First user registered as Administrator."
          : "Registration successful. Welcome to Apex Bank!",
      user: userResponse,
      token,
      primaryAccount,
    });

    // Set HTTP-only session cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal registration error";
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
