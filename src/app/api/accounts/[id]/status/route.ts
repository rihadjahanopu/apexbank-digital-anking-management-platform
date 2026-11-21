import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { BankAccount } from "@/models/BankAccount";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, ACCOUNT_STATUS } from "@/lib/constants";

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

    if (!Object.values(ACCOUNT_STATUS).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid account status." },
        { status: 400 }
      );
    }

    const updated = await BankAccount.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Bank account not found." },
        { status: 404 }
      );
    }

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: `ACCOUNT_STATUS_CHANGED_TO_${status}`,
      category: "ACCOUNT",
      details: { accountId: id, accountNumber: updated.accountNumber, reason, status },
    });

    return NextResponse.json({
      success: true,
      message: `Account #${updated.accountNumber} status set to ${status}.`,
      account: updated,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update account status";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
