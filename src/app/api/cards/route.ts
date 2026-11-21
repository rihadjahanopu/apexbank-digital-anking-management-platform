import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/models/Card";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN, ROLES.STAFF]);
    if (errorResponse || !user) return errorResponse;

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status");
    const network = url.searchParams.get("network");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const filter: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }
    if (network && network !== "ALL") {
      filter.network = network;
    }
    if (search) {
      filter.$or = [
        { maskedCardNumber: { $regex: search, $options: "i" } },
        { cardHolderName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [cards, total] = await Promise.all([
      Card.find(filter)
        .populate("userId", "name email phone")
        .populate("accountId", "accountNumber accountType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Card.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      cards,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
      totalCards: total,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load cards";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
