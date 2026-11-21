import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/models/Card";
import { AuditLog } from "@/models/AuditLog";
import { ROLES } from "@/lib/constants";

export async function PATCH(
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

    const card = await Card.findById(id);
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

    const body = await req.json();
    const {
      dailyOnlineLimit,
      dailyAtmLimit,
      dailyPosLimit,
      isOnlineEnabled,
      isAtmEnabled,
      isPosEnabled,
      isInternationalEnabled,
    } = body;

    if (typeof dailyOnlineLimit === "number") card.dailyOnlineLimit = Math.max(0, dailyOnlineLimit);
    if (typeof dailyAtmLimit === "number") card.dailyAtmLimit = Math.max(0, dailyAtmLimit);
    if (typeof dailyPosLimit === "number") card.dailyPosLimit = Math.max(0, dailyPosLimit);
    if (typeof isOnlineEnabled === "boolean") card.isOnlineEnabled = isOnlineEnabled;
    if (typeof isAtmEnabled === "boolean") card.isAtmEnabled = isAtmEnabled;
    if (typeof isPosEnabled === "boolean") card.isPosEnabled = isPosEnabled;
    if (typeof isInternationalEnabled === "boolean") card.isInternationalEnabled = isInternationalEnabled;

    await card.save();

    await AuditLog.create({
      userId: authUser._id,
      userRole: authUser.role,
      action: "CARD_CONTROLS_UPDATED",
      category: "ACCOUNT",
      details: {
        cardId: card._id,
        limits: {
          online: card.dailyOnlineLimit,
          atm: card.dailyAtmLimit,
          pos: card.dailyPosLimit,
        },
        channels: {
          online: card.isOnlineEnabled,
          atm: card.isAtmEnabled,
          pos: card.isPosEnabled,
          international: card.isInternationalEnabled,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Card limits and channel toggles updated successfully.",
      card,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update card controls";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
