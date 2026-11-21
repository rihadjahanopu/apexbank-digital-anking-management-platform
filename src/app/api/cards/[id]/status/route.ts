import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/models/Card";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, CARD_STATUS } from "@/lib/constants";

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

    const body = await req.json();
    const { status, reason } = body;

    if (!status || !Object.values(CARD_STATUS).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid card status." },
        { status: 400 }
      );
    }

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

    // Customers can only switch between ACTIVE and FROZEN
    if (
      authUser.role === ROLES.CUSTOMER &&
      status === CARD_STATUS.BLOCKED
    ) {
      // Blocking is permanent
      card.status = CARD_STATUS.BLOCKED;
    } else {
      card.status = status;
    }

    await card.save();

    await AuditLog.create({
      userId: authUser._id,
      userRole: authUser.role,
      action: `CARD_STATUS_${status}`,
      category: "ACCOUNT",
      details: {
        cardId: card._id,
        newStatus: status,
        reason: reason || "Customer/Staff card action",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Card is now ${status.toLowerCase()}.`,
      card,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update card status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
