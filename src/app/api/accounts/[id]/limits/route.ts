import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { BankAccount } from "@/models/BankAccount";
import { AuditLog } from "@/models/AuditLog";
import { ROLES } from "@/lib/constants";

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
    const { dailyTransferLimit, minimumBalance } = body;

    const updateFields: Record<string, number> = {};
    if (typeof dailyTransferLimit === "number") {
      updateFields.dailyTransferLimit = Math.max(0, dailyTransferLimit);
    }
    if (typeof minimumBalance === "number") {
      updateFields.minimumBalance = Math.max(0, minimumBalance);
    }

    const updated = await BankAccount.findByIdAndUpdate(
      id,
      { $set: updateFields },
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
      action: "ACCOUNT_LIMITS_UPDATED",
      category: "ACCOUNT",
      details: { accountId: id, ...updateFields },
    });

    return NextResponse.json({
      success: true,
      message: `Limits updated for Account #${updated.accountNumber}.`,
      account: updated,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update account limits";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
