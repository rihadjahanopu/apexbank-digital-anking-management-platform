import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passkey } from "@/models/Passkey";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req);
    if (errorResponse || !authUser) return errorResponse;

    const passkeys = await Passkey.find({ userId: authUser._id })
      .select("credentialId name deviceType backedUp transports lastUsedAt createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      passkeys,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch passkeys";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
