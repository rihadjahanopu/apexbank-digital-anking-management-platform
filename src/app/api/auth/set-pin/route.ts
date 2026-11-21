import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { requireAuth, hashPassword } from "@/lib/auth";
import { setPinSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const parseResult = setPinSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const { pin } = parseResult.data;

    // Hash the 4-digit PIN for security
    const hashedPin = await hashPassword(pin);

    await User.findByIdAndUpdate(user._id, {
      transactionPin: hashedPin,
    });

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "TRANSACTION_PIN_UPDATED",
      category: "AUTH",
    });

    return NextResponse.json({
      success: true,
      message: "Transaction PIN configured successfully.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "PIN configuration failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
