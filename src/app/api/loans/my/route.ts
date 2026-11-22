import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Loan } from "@/models/Loan";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const loans = await Loan.find({ userId: user._id })
      .populate("accountId", "accountNumber accountType")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      loans,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load customer loans";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
