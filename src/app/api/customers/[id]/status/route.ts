import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, USER_STATUS } from "@/lib/constants";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { status, reason } = body;

    if (!Object.values(USER_STATUS).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid user status." },
        { status: 400 }
      );
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { status },
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
      action: `CUSTOMER_STATUS_CHANGED_TO_${status}`,
      category: "CUSTOMER",
      details: { targetCustomerId: id, reason, status },
    });

    return NextResponse.json({
      success: true,
      message: `Customer status updated to ${status}.`,
      customer: updated,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Status update failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
