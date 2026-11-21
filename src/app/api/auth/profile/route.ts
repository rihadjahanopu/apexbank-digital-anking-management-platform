import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { requireAuth } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations/auth";

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const updated = await User.findByIdAndUpdate(
      user._id,
      { $set: parseResult.data },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "USER_PROFILE_UPDATED",
      category: "AUTH",
      details: parseResult.data,
    });

    const userResponse = {
      _id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      role: updated.role,
      status: updated.status,
      phone: updated.phone,
      address: updated.address,
      nationalId: updated.nationalId,
      transactionPinSet: !!updated.transactionPin,
      isVerified: updated.isVerified,
      twoFactorEnabled: updated.twoFactorEnabled,
      avatarUrl: updated.avatarUrl,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: userResponse,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Profile update failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
