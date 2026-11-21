import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getRelyingPartyConfig } from "@/lib/passkey";

export async function POST(req: Request) {
  try {
    const { rpID } = getRelyingPartyConfig(req);

    // Generate discoverable authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials: [], // Allows discoverable credentials (Conditional UI / 1-click modal)
    });

    const response = NextResponse.json({
      success: true,
      options,
    });

    // Set temporary challenge cookie for verification (expires in 5 minutes)
    response.cookies.set("passkey_login_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate passkey login options";
    console.error("Passkey login options error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
