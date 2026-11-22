import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Loan } from "@/models/Loan";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const loan = await Loan.findById(id)
      .populate("userId", "name email phone nationalId")
      .populate("accountId", "accountNumber accountType")
      .populate("reviewedBy", "name email")
      .populate("approvedBy", "name email");

    if (!loan) {
      return NextResponse.json(
        { success: false, error: "Loan file not found." },
        { status: 404 }
      );
    }

    // Customers can only view their own loans
    if (
      user.role === "CUSTOMER" &&
      loan.userId._id.toString() !== user._id.toString()
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to loan dossier." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      loan,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load loan file";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
