import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth, comparePassword } from "@/lib/auth";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { verifyTotp } from "@/lib/totp";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req);
    if (errorResponse || !authUser) return errorResponse;

    const body = await req.json();
    const { password, token } = body;

    if (!password || !token) {
      return NextResponse.json(
        { success: false, error: "Password and 6-digit TOTP code are required." },
        { status: 400 }
      );
    }

    const user = await User.findById(authUser._id).select("+password +twoFactorSecret");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Incorrect password." },
        { status: 401 }
      );
    }

    if (user.twoFactorSecret) {
      const isValid = verifyTotp(token, user.twoFactorSecret);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid 6-digit TOTP code." },
          { status: 400 }
        );
      }
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "2FA_DISABLED",
      category: "AUTH",
      details: { email: user.email },
    });

    return NextResponse.json({
      success: true,
      message: "Two-Factor Authentication has been disabled.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to disable 2FA";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
