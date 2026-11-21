import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Passkey } from "@/models/Passkey";
import { AuditLog } from "@/models/AuditLog";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req);
    if (errorResponse || !authUser) return errorResponse;

    const { id } = await params;

    const passkey = await Passkey.findOne({ _id: id, userId: authUser._id });
    if (!passkey) {
      return NextResponse.json(
        { success: false, error: "Passkey not found or unauthorized." },
        { status: 404 }
      );
    }

    await Passkey.findByIdAndDelete(passkey._id);

    await AuditLog.create({
      userId: authUser._id,
      userRole: authUser.role,
      action: "PASSKEY_DELETED",
      category: "AUTH",
      details: {
        credentialId: passkey.credentialId,
        name: passkey.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Passkey "${passkey.name}" revoked successfully.`,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to revoke passkey";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
