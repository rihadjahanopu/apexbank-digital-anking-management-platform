import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Card } from "@/models/Card";
import { ROLES } from "@/lib/constants";

export async function GET(
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

    const url = new URL(req.url);
    const reveal = url.searchParams.get("reveal") === "true";
    const pin = req.headers.get("x-card-pin") || url.searchParams.get("pin");

    const card = reveal
      ? await Card.findById(id)
          .populate("accountId", "accountNumber accountType balance status")
          .select("+cardNumber +cvv +pin")
      : await Card.findById(id).populate(
          "accountId",
          "accountNumber accountType balance status"
        );

    if (!card) {
      return NextResponse.json(
        { success: false, error: "Card not found" },
        { status: 404 }
      );
    }

    if (
      authUser.role === ROLES.CUSTOMER &&
      card.userId.toString() !== authUser._id.toString()
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to this card" },
        { status: 403 }
      );
    }

    if (reveal) {
      if (!pin) {
        return NextResponse.json(
          { success: false, error: "PIN is required to reveal full card credentials." },
          { status: 400 }
        );
      }
      if (card.pin) {
        const isPinValid = await bcrypt.compare(pin, card.pin);
        if (!isPinValid) {
          return NextResponse.json(
            { success: false, error: "Invalid card PIN." },
            { status: 401 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      card,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch card";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
