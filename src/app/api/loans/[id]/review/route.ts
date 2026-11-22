import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Loan } from "@/models/Loan";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, LOAN_STATUS } from "@/lib/constants";

export async function POST(
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
    const { action, note = "" } = body; // action: "FORWARD_ADMIN" | "REJECT"

    const loan = await Loan.findById(id);
    if (!loan) {
      return NextResponse.json(
        { success: false, error: "Loan application not found." },
        { status: 404 }
      );
    }

    if (action === "FORWARD_ADMIN") {
      loan.forwardedToAdmin = true;
      loan.status = LOAN_STATUS.UNDER_REVIEW;
      loan.reviewedBy = user._id;
      if (note) {
        loan.internalNotes = (loan.internalNotes ? `${loan.internalNotes}\n` : "") + `Staff Note: ${note}`;
      }
      await loan.save();

      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: "STAFF_FORWARDED_LOAN_TO_ADMIN",
        category: "LOAN",
        details: { loanNumber: loan.loanNumber, note },
      });

      return NextResponse.json({
        success: true,
        message: `Loan application #${loan.loanNumber} verified and forwarded to Administration.`,
        loan,
      });
    } else {
      loan.status = LOAN_STATUS.REJECTED;
      loan.reviewedBy = user._id;
      if (note) {
        loan.internalNotes = (loan.internalNotes ? `${loan.internalNotes}\n` : "") + `Staff Rejection: ${note}`;
      }
      await loan.save();

      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: "STAFF_REJECTED_LOAN",
        category: "LOAN",
        details: { loanNumber: loan.loanNumber, note },
      });

      return NextResponse.json({
        success: true,
        message: `Loan application #${loan.loanNumber} rejected at staff desk.`,
        loan,
      });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Staff review failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
