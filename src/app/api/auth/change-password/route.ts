import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { requireAuth, comparePassword, hashPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const parseResult = changePasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parseResult.data;

    // Fetch user with current password
    const userWithPassword = await User.findById(user._id).select("+password");
    if (!userWithPassword) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    const isMatch = await comparePassword(
      currentPassword,
      userWithPassword.password
    );
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Incorrect current password." },
        { status: 400 }
      );
    }

    userWithPassword.password = await hashPassword(newPassword);
    await userWithPassword.save();

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "USER_PASSWORD_CHANGED",
      category: "AUTH",
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Password update failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
