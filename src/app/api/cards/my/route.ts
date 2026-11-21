import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/models/Card";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.CUSTOMER,
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !user) return errorResponse;

    const cards = await Card.find({ userId: user._id })
      .populate("accountId", "accountNumber accountType balance status")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      cards,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load cards";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
