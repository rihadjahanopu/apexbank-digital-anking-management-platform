import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { PinResetRequest } from "@/models/PinResetRequest";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const request = await PinResetRequest.findOne({ userId: user._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      request,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load request";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
