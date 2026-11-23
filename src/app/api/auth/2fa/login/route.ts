import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { signToken } from "@/lib/auth";
import { verifyTotp } from "@/lib/totp";
import { ROLES, ACCOUNT_STATUS } from "@/lib/constants";
import { BankAccount } from "@/models/BankAccount";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { tempToken, token } = body;

    if (!tempToken || !token) {
      return NextResponse.json(
        { success: false, error: "Session token and 6-digit code are required." },
        { status: 400 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret";
    let decoded: { userId: string; email: string; isTemp2fa: boolean };
    try {
      decoded = jwt.verify(tempToken, jwtSecret) as {
        userId: string;
        email: string;
        isTemp2fa: boolean;
      };
    } catch {
      return NextResponse.json(
        { success: false, error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    if (!decoded.isTemp2fa) {
      return NextResponse.json(
        { success: false, error: "Invalid 2FA session token." },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId).select("+twoFactorSecret");
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, error: "User or 2FA credentials not found." },
        { status: 404 }
      );
    }

    const isValid = verifyTotp(token, user.twoFactorSecret);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid 6-digit authenticator code." },
        { status: 401 }
      );
    }

    // Sign full user token
    const fullToken = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "USER_LOGIN_2FA_SUCCESS",
      category: "AUTH",
      details: { email: user.email, role: user.role },
    });

    const accountCount = await BankAccount.countDocuments({
      userId: user._id,
      status: { $ne: ACCOUNT_STATUS.CLOSED },
    });
    const hasAccount = user.role !== ROLES.CUSTOMER || accountCount > 0;

    const userResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      address: user.address,
      nationalId: user.nationalId,
      transactionPinSet: !!user.transactionPin,
      isVerified: user.isVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      avatarUrl: user.avatarUrl,
      hasAccount,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: userResponse,
      token: fullToken,
    });

    response.cookies.set("auth_token", fullToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "2FA login verification failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
