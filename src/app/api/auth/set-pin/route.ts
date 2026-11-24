import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { requireAuth, hashPassword, comparePassword } from "@/lib/auth";
import { setPinSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const fullUser = await User.findById(user._id).select("+password +transactionPin");
    if (!fullUser) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

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

    const { pin, currentPin, currentPassword } = parseResult.data;
    const hasExistingPin = !!fullUser.transactionPin;

    if (hasExistingPin) {
      // Must provide current PIN or current account password to authorize changing it
      const checkSecret = currentPin || currentPassword;
      if (!checkSecret) {
        return NextResponse.json(
          {
            success: false,
            error: "Current transaction PIN (or account password) is required to set a new PIN.",
          },
          { status: 400 }
        );
      }

      let isVerified = false;
      if (fullUser.transactionPin) {
        isVerified = await comparePassword(checkSecret, fullUser.transactionPin);
      }
      if (!isVerified && fullUser.password) {
        isVerified = await comparePassword(checkSecret, fullUser.password);
      }

      if (!isVerified) {
        return NextResponse.json(
          {
            success: false,
            error: "Incorrect current transaction PIN or account password. Please verify and try again.",
          },
          { status: 400 }
        );
      }

      if (currentPin && currentPin === pin) {
        return NextResponse.json(
          {
            success: false,
            error: "New PIN cannot be the same as your current PIN. Please choose a different 4-digit PIN.",
          },
          { status: 400 }
        );
      }
    }

    // Hash the 4-digit PIN for security
    const hashedPin = await hashPassword(pin);

    await User.findByIdAndUpdate(user._id, {
      transactionPin: hashedPin,
    });

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: hasExistingPin ? "TRANSACTION_PIN_UPDATED" : "TRANSACTION_PIN_CONFIGURED",
      category: "AUTH",
      details: {
        method: hasExistingPin ? "PIN_CHANGE_VERIFIED" : "INITIAL_SETUP",
      },
    });

    return NextResponse.json({
      success: true,
      message: hasExistingPin
        ? "Transaction PIN updated successfully."
        : "Transaction PIN configured successfully.",
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
