import { NextResponse } from "next/server";
import qrcode from "qrcode";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { generateTotpSecret, generateTotpUri } from "@/lib/totp";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const secret = generateTotpSecret();
    const serviceName = process.env.NEXT_PUBLIC_APP_NAME || "Apex Bank";
    const otpauth = generateTotpUri(user.email, serviceName, secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

    return NextResponse.json({
      success: true,
      secret,
      qrCodeDataUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate 2FA";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
