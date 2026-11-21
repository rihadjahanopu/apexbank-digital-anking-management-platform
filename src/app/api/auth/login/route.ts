import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { loginSchema } from "@/lib/validations/auth";
import { comparePassword, signToken } from "@/lib/auth";
import { USER_STATUS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || "Invalid credentials",
        },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // Retrieve user including hashed password and PIN status
    const user = await User.findOne({ email }).select("+password +transactionPin");
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Validate account status
    if (user.status === USER_STATUS.BLOCKED) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account has been blocked. Please contact bank administration.",
        },
        { status: 403 }
      );
    }

    if (user.status === USER_STATUS.INACTIVE) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account is deactivated. Please contact customer support.",
        },
        { status: 403 }
      );
    }

    // Check if Two-Factor Authentication is enabled
    if (user.twoFactorEnabled) {
      const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret";
      const tempToken = jwt.sign(
        { userId: user._id.toString(), email: user.email, isTemp2fa: true },
        jwtSecret,
        { expiresIn: "5m" }
      );

      return NextResponse.json({
        success: true,
        requireTwoFactor: true,
        tempToken,
        message: "Two-factor authentication required. Please enter your 6-digit code.",
      });
    }

    // Sign JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Record audit log
    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "USER_LOGIN_SUCCESS",
      category: "AUTH",
      details: { email: user.email, role: user.role },
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
      transactionPinSet: !!user.transactionPin,
      isVerified: user.isVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: userResponse,
      token,
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
    const message = error instanceof Error ? error.message : "Internal login error";
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
