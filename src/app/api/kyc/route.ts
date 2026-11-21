import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/User";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN, ROLES.STAFF]);
    if (errorResponse || !user) return errorResponse;

    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const query: Record<string, unknown> = {
      "kycDocuments.0": { $exists: true },
    };

    if (status && status !== "ALL") {
      query["kycDocuments.status"] = status;
    }

    const customers = await User.find(query)
      .select("name email phone role isVerified kycDocuments createdAt")
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch KYC queue";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
