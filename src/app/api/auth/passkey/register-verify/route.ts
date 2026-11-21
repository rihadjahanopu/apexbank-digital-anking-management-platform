import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/User";
import { Passkey } from "@/models/Passkey";
import { AuditLog } from "@/models/AuditLog";
import { getRelyingPartyConfig } from "@/lib/passkey";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req);
    if (errorResponse || !authUser) return errorResponse;

    const body = await req.json();
    const { credential, name = "Biometric Passkey", expectedChallenge: clientChallenge } = body;

    if (!credential || !credential.id) {
      return NextResponse.json(
        { success: false, error: "Invalid registration credential payload." },
        { status: 400 }
      );
    }

    // Retrieve challenge from cookie (primary) or MongoDB user document (fallback)
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").filter(Boolean).map((c) => {
        const [k, ...v] = c.split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );
    const cookieChallenge = cookies["passkey_register_challenge"];

    const user = await User.findById(authUser._id).select("+currentChallenge");
    const expectedChallenge = cookieChallenge || user?.currentChallenge || clientChallenge;

    if (!expectedChallenge) {
      return NextResponse.json(
        { success: false, error: "Registration challenge expired. Please retry." },
        { status: 400 }
      );
    }

    const { rpID, origin } = getRelyingPartyConfig(req);

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { success: false, error: "Passkey cryptographic attestation failed." },
        { status: 400 }
      );
    }

    const {
      credential: regCred,
      credentialDeviceType,
      credentialBackedUp,
      aaguid,
    } = verification.registrationInfo;

    // Convert public key buffer to Base64URL string
    const publicKeyBase64 = isoBase64URL.fromBuffer(regCred.publicKey);

    // Save Passkey to database
    const newPasskey = await Passkey.create({
      userId: authUser._id,
      credentialId: regCred.id,
      publicKey: publicKeyBase64,
      counter: regCred.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.response?.transports || [],
      aaguid: aaguid || undefined,
      name: name.trim() || "Biometric Passkey",
      lastUsedAt: new Date(),
    });

    // Clear challenge from MongoDB
    await User.findByIdAndUpdate(authUser._id, {
      $unset: { currentChallenge: 1 },
    });

    await AuditLog.create({
      userId: authUser._id,
      userRole: authUser.role,
      action: "PASSKEY_REGISTERED",
      category: "AUTH",
      details: {
        credentialId: regCred.id,
        name: newPasskey.name,
        deviceType: credentialDeviceType,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: `Passkey "${newPasskey.name}" registered successfully! You can now use Touch ID, Face ID, or Windows Hello for instant sign-in.`,
      passkey: {
        _id: newPasskey._id,
        name: newPasskey.name,
        deviceType: newPasskey.deviceType,
        createdAt: newPasskey.createdAt,
      },
    });

    // Clear challenge cookie
    response.cookies.delete("passkey_register_challenge");

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to verify passkey registration";
    console.error("Passkey register verify error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
