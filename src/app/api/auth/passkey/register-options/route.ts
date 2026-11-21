import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/User";
import { Passkey } from "@/models/Passkey";
import { getRelyingPartyConfig } from "@/lib/passkey";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req);
    if (errorResponse || !authUser) return errorResponse;

    const { rpName, rpID } = getRelyingPartyConfig(req);

    // Fetch existing passkeys to exclude duplicates
    const existingPasskeys = await Passkey.find({ userId: authUser._id });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: isoUint8Array.fromUTF8String(authUser._id.toString()),
      userName: authUser.email,
      userDisplayName: authUser.name,
      attestationType: "none",
      excludeCredentials: existingPasskeys.map((p) => ({
        id: p.credentialId,
        transports: p.transports as unknown as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // 1. Atomic update to MongoDB user document (bypasses cached Mongoose schema validation)
    await User.findByIdAndUpdate(authUser._id, {
      $set: { currentChallenge: options.challenge },
    });

    const response = NextResponse.json({
      success: true,
      options,
    });

    // 2. Also set secure HTTP-only challenge cookie (same robust mechanism as login)
    response.cookies.set("passkey_register_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate passkey options";
    console.error("Passkey register options error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
