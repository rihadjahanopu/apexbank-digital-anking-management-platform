import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/models/Card";
import { AuditLog } from "@/models/AuditLog";
import { ROLES } from "@/lib/constants";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req, [
      ROLES.CUSTOMER,
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !authUser) return errorResponse;

    const { id } = await params;

    const body = await req.json();
    const { currentPin, newPin } = body;

    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { success: false, error: "New PIN must be exactly 4 digits." },
        { status: 400 }
      );
    }

    const card = await Card.findById(id).select("+pin");
    if (!card) {
      return NextResponse.json(
        { success: false, error: "Card not found." },
        { status: 404 }
      );
    }

    if (
      authUser.role === ROLES.CUSTOMER &&
      card.userId.toString() !== authUser._id.toString()
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to this card." },
        { status: 403 }
      );
    }

    // Verify current PIN if one was already set
    if (card.pin && authUser.role === ROLES.CUSTOMER) {
      if (!currentPin) {
        return NextResponse.json(
          { success: false, error: "Current PIN is required." },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(currentPin, card.pin);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: "Current PIN is incorrect." },
          { status: 401 }
        );
      }
    }

    card.pin = await bcrypt.hash(newPin, 10);
    await card.save();

    await AuditLog.create({
      userId: authUser._id,
      userRole: authUser.role,
      action: "CARD_PIN_CHANGED",
      category: "ACCOUNT",
      details: { cardId: card._id },
    });

    return NextResponse.json({
      success: true,
      message: "Card PIN updated successfully.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to change card PIN";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
