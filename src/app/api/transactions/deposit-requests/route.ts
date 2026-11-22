import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { DepositRequest } from "@/models/DepositRequest";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "15", 10);
    const status = url.searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (user.role === ROLES.CUSTOMER) {
      filter.userId = user._id;
    }
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const total = await DepositRequest.countDocuments(filter);
    const requests = await DepositRequest.find(filter)
      .populate("accountId", "accountNumber accountType")
      .populate("userId", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load deposit requests";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
