import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AccountClosureRequest } from "@/models/AccountClosureRequest";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req, [
      ROLES.CUSTOMER,
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !authUser) return errorResponse;

    const requests = await AccountClosureRequest.find({ userId: authUser._id })
      .populate("accountId", "accountNumber accountType status balance")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load closure requests.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
