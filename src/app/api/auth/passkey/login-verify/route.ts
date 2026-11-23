import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Passkey } from "@/models/Passkey";
import { AuditLog } from "@/models/AuditLog";
import { signToken } from "@/lib/auth";
import { USER_STATUS, ROLES, ACCOUNT_STATUS } from "@/lib/constants";
import { BankAccount } from "@/models/BankAccount";
import { getRelyingPartyConfig } from "@/lib/passkey";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { credential, expectedChallenge: clientChallenge } = body;

    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").filter(Boolean).map((c) => {
        const [k, ...v] = c.split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );
    const expectedChallenge = cookies["passkey_login_challenge"] || clientChallenge;

    if (!expectedChallenge) {
      return NextResponse.json(
        { success: false, error: "Authentication challenge expired. Please retry." },
        { status: 400 }
      );
    }

    if (!credential || !credential.id) {
      return NextResponse.json(
        { success: false, error: "Invalid assertion credential payload." },
        { status: 400 }
      );
    }

    // Look up registered passkey by credential ID
    const passkey = await Passkey.findOne({ credentialId: credential.id });
    if (!passkey) {
      // Per Modern Web Guidance: Return 404 so client can trigger signalUnknownCredential
      return NextResponse.json(
        { success: false, error: "Passkey credential not recognized by this server." },
        { status: 404 }
      );
    }

    // Look up user
    const user = await User.findById(passkey.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account associated with this passkey not found." },
        { status: 404 }
      );
    }

    if (user.status === USER_STATUS.BLOCKED) {
      return NextResponse.json(
        { success: false, error: "Account blocked. Contact bank compliance administration." },
        { status: 403 }
      );
    }

    const { rpID, origin } = getRelyingPartyConfig(req);

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: isoBase64URL.toBuffer(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports as unknown as AuthenticatorTransport[],
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      return NextResponse.json(
        { success: false, error: "Passkey biometric signature verification failed." },
        { status: 401 }
      );
    }

    // Update passkey counter and lastUsed timestamp
    passkey.counter = verification.authenticationInfo.newCounter;
    passkey.lastUsedAt = new Date();
    await passkey.save();

    // Generate JWT token
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "PASSKEY_LOGIN_SUCCESS",
      category: "AUTH",
      details: {
        credentialId: passkey.credentialId,
        name: passkey.name,
      },
    });

    const accountCount = await BankAccount.countDocuments({
      userId: user._id,
      status: { $ne: ACCOUNT_STATUS.CLOSED },
    });
    const hasAccount = user.role !== ROLES.CUSTOMER || accountCount > 0;

    const userResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      address: user.address,
      nationalId: user.nationalId,
      transactionPinSet: !!user.transactionPin,
      isVerified: user.isVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      avatarUrl: user.avatarUrl,
      hasAccount,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      message: `Biometric authentication verified. Welcome back, ${user.name}!`,
      user: userResponse,
      token,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Clear challenge cookie
    response.cookies.delete("passkey_login_challenge");

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to verify passkey authentication";
    console.error("Passkey login verify error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
