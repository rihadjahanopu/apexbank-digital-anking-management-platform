import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { PinResetRequest } from "@/models/PinResetRequest";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, REQUEST_STATUS, NOTIFICATION_TYPES } from "@/lib/constants";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.STAFF, ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const { action, remarks } = body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid review action. Must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    const resetRequest = await PinResetRequest.findById(params.id);
    if (!resetRequest) {
      return NextResponse.json(
        { success: false, error: "PIN reset request not found." },
        { status: 404 }
      );
    }

    if (resetRequest.status !== REQUEST_STATUS.PENDING) {
      return NextResponse.json(
        {
          success: false,
          error: `Request has already been processed with status ${resetRequest.status}.`,
        },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      resetRequest.status = REQUEST_STATUS.APPROVED;
      resetRequest.reviewedBy = user._id;
      resetRequest.reviewedAt = new Date();
      resetRequest.adminRemarks = remarks || "PIN reset approved by bank staff.";
      await resetRequest.save();

      // Clear the transactionPin in the User record so user can set a fresh one
      await User.findByIdAndUpdate(resetRequest.userId, {
        $unset: { transactionPin: 1 },
      });

      // Notify customer
      await Notification.create({
        userId: resetRequest.userId,
        title: "Transaction PIN Reset Approved",
        message: "Your transaction PIN has been successfully reset by bank staff. You can now configure a fresh 4-digit PIN from your Profile.",
        type: NOTIFICATION_TYPES.SECURITY_ALERT,
        link: "/profile",
      });

      // Audit Log
      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: "PIN_RESET_APPROVED",
        category: "CUSTOMER",
        details: {
          targetUserId: resetRequest.userId,
          requestId: resetRequest._id,
          remarks: resetRequest.adminRemarks,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Transaction PIN has been reset. The customer can now configure a fresh 4-digit PIN.",
      });
    } else {
      resetRequest.status = REQUEST_STATUS.REJECTED;
      resetRequest.reviewedBy = user._id;
      resetRequest.reviewedAt = new Date();
      resetRequest.adminRemarks = remarks || "PIN reset request rejected by bank staff.";
      await resetRequest.save();

      // Notify customer
      await Notification.create({
        userId: resetRequest.userId,
        title: "PIN Reset Request Rejected",
        message: `Your transaction PIN reset request was rejected by staff. Remarks: ${resetRequest.adminRemarks}`,
        type: NOTIFICATION_TYPES.SECURITY_ALERT,
        link: "/profile",
      });

      // Audit Log
      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: "PIN_RESET_REJECTED",
        category: "CUSTOMER",
        details: {
          targetUserId: resetRequest.userId,
          requestId: resetRequest._id,
          remarks: resetRequest.adminRemarks,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Transaction PIN reset request has been rejected.",
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to review PIN reset request";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
