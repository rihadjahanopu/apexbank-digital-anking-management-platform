import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Loan } from "@/models/Loan";
import { AuditLog } from "@/models/AuditLog";
import { ROLES } from "@/lib/constants";

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
    const { note, forwardToAdmin = false } = body;

    const loan = await Loan.findById(id);
    if (!loan) {
      return NextResponse.json(
        { success: false, error: "Loan application not found." },
        { status: 404 }
      );
    }

    loan.internalNotes = note;
    if (forwardToAdmin) {
      loan.forwardedToAdmin = true;
      loan.status = "UNDER_REVIEW";
      loan.reviewedBy = user._id;
    }
    await loan.save();

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "LOAN_NOTE_UPDATED",
      category: "LOAN",
      details: { loanId: id, forwardToAdmin },
    });

    return NextResponse.json({
      success: true,
      message: forwardToAdmin
        ? "Note appended and application forwarded to Administration for approval."
        : "Internal risk note appended.",
      loan,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to save note";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
