import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    return NextResponse.json({
      success: true,
      isVerified: user.isVerified,
      kycDocuments: user.kycDocuments || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load KYC records";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
