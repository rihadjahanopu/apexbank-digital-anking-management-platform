import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { BankAccount } from "@/models/BankAccount";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const accounts = await BankAccount.find({ userId: user._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load accounts";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
