import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Loan } from "@/models/Loan";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, LOAN_STATUS, NOTIFICATION_TYPES } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason = "Credit score criteria not met" } = body;

    const loan = await Loan.findById(id);
    if (!loan) {
      return NextResponse.json(
        { success: false, error: "Loan application not found." },
        { status: 404 }
      );
    }

    loan.status = LOAN_STATUS.REJECTED;
    loan.internalNotes =
      (loan.internalNotes ? `${loan.internalNotes}\n` : "") +
      `Rejection reason: ${reason}`;
    await loan.save();

    await Notification.create({
      userId: loan.userId,
      title: "Loan Application Declined",
      message: `Your credit request of ${formatCurrency(
        loan.amount
      )} (Loan #${loan.loanNumber}) was declined. Reason: ${reason}`,
      type: NOTIFICATION_TYPES.LOAN_REJECTED,
    });

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "LOAN_REJECTED",
      category: "LOAN",
      details: { loanNumber: loan.loanNumber, reason },
    });

    return NextResponse.json({
      success: true,
      message: `Loan #${loan.loanNumber} rejected.`,
      loan,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Loan rejection failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
