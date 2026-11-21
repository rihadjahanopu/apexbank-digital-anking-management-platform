import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AuditLog } from "@/models/AuditLog";
import { verifyTotp } from "@/lib/totp";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const { token, secret } = body;

    if (!token || !secret) {
      return NextResponse.json(
        { success: false, error: "Code and secret are required." },
        { status: 400 }
      );
    }

    const isValid = verifyTotp(token, secret);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code. Please try again." },
        { status: 400 }
      );
    }

    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "2FA_ENABLED",
      category: "AUTH",
      details: { email: user.email },
    });

    return NextResponse.json({
      success: true,
      message: "Two-Factor Authentication is now enabled on your account!",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify 2FA";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
