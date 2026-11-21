import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { ROLES } from "@/lib/constants";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { isVerified = true } = body;

    const updated = await User.findByIdAndUpdate(
      id,
      { isVerified },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Customer not found." },
        { status: 404 }
      );
    }

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: isVerified ? "CUSTOMER_KYC_VERIFIED" : "CUSTOMER_KYC_UNVERIFIED",
      category: "CUSTOMER",
      details: { targetCustomerId: id },
    });

    return NextResponse.json({
      success: true,
      message: `Customer KYC ${isVerified ? "verified" : "unverified"} successfully.`,
      customer: updated,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Verification update failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
