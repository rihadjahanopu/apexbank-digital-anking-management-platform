import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth, comparePassword } from "@/lib/auth";
import { PinResetRequest } from "@/models/PinResetRequest";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import { REQUEST_STATUS, NOTIFICATION_TYPES } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const reason = (body.reason || "").trim();
    const password = body.password;

    if (!reason || reason.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid explanation (minimum 5 characters) for requesting a PIN reset.",
        },
        { status: 400 }
      );
    }

    // Verify account password if provided
    if (password) {
      const fullUser = await User.findById(user._id).select("+password");
      if (fullUser?.password) {
        const isMatch = await comparePassword(password, fullUser.password);
        if (!isMatch) {
          return NextResponse.json(
            { success: false, error: "Incorrect account password. Verification failed." },
            { status: 400 }
          );
        }
      }
    }

    // Check if user already has a pending request
    const existingPending = await PinResetRequest.findOne({
      userId: user._id,
      status: REQUEST_STATUS.PENDING,
    });

    if (existingPending) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a PIN reset request awaiting staff review.",
        },
        { status: 400 }
      );
    }

    const resetRequest = await PinResetRequest.create({
      userId: user._id,
      reason,
      status: REQUEST_STATUS.PENDING,
    });

    // In-app Notification for customer
    await Notification.create({
      userId: user._id,
      title: "PIN Reset Request Submitted",
      message: "Your transaction PIN reset request has been received and logged. Bank operations staff will review your identity and reset your PIN.",
      type: NOTIFICATION_TYPES.SECURITY_ALERT,
      link: "/profile",
    });

    // Audit Log
    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "PIN_RESET_REQUEST_SUBMITTED",
      category: "AUTH",
      details: { requestId: resetRequest._id, reason },
    });

    return NextResponse.json({
      success: true,
      message: "Your transaction PIN reset request has been submitted to bank staff for review.",
      request: resetRequest,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit PIN reset request";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
