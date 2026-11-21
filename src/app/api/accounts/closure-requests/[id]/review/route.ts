import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AccountClosureRequest } from "@/models/AccountClosureRequest";
import { BankAccount } from "@/models/BankAccount";
import { Card } from "@/models/Card";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import {
  ROLES,
  REQUEST_STATUS,
  ACCOUNT_STATUS,
  CARD_STATUS,
  NOTIFICATION_TYPES,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/money";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !authUser) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { action, adminRemarks = "" } = body; // action: "APPROVE" | "REJECT"

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    const closureRequest = await AccountClosureRequest.findById(id);
    if (!closureRequest) {
      return NextResponse.json(
        { success: false, error: "Account closure request not found." },
        { status: 404 }
      );
    }

    if (closureRequest.status !== REQUEST_STATUS.PENDING) {
      return NextResponse.json(
        {
          success: false,
          error: `Account closure request is already ${closureRequest.status.toLowerCase()}.`,
        },
        { status: 400 }
      );
    }

    // Customer / staff cannot approve their own account closure
    if (closureRequest.userId.toString() === authUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Staff cannot approve their own account closure requests." },
        { status: 403 }
      );
    }

    const account = await BankAccount.findById(closureRequest.accountId);
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Target bank account not found." },
        { status: 404 }
      );
    }

    if (action === "APPROVE") {
      // 1. Mark account status as CLOSED
      account.status = ACCOUNT_STATUS.CLOSED;
      await account.save();

      // 2. Block any active cards tied to this account
      await Card.updateMany(
        { accountId: account._id, status: { $ne: CARD_STATUS.BLOCKED } },
        { status: CARD_STATUS.BLOCKED }
      );

      // 3. Update request status
      closureRequest.status = REQUEST_STATUS.APPROVED;
      closureRequest.reviewedBy = authUser._id;
      closureRequest.reviewedAt = new Date();
      closureRequest.adminRemarks = adminRemarks;
      await closureRequest.save();

      // 4. Create notification
      await Notification.create({
        userId: closureRequest.userId,
        title: "Account Closed",
        message: `Your request to close account ${account.accountNumber} (Balance at closure: ${formatCurrency(
          closureRequest.balance
        )}) has been approved. The account and its associated cards are now permanently closed.`,
        type: NOTIFICATION_TYPES.ACCOUNT_CLOSURE_APPROVED,
        link: "/customer/accounts",
      });

      // 5. Create audit log
      await AuditLog.create({
        userId: authUser._id,
        userRole: authUser.role,
        action: "ACCOUNT_CLOSURE_APPROVED",
        category: "ACCOUNT",
        details: {
          requestId: closureRequest._id,
          accountId: account._id,
          accountNumber: account.accountNumber,
          balance: closureRequest.balance,
          payoutAccount: closureRequest.targetPayoutAccount,
          remarks: adminRemarks,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Account ${account.accountNumber} has been officially closed and all cards blocked.`,
        data: closureRequest,
      });
    } else {
      // REJECT
      closureRequest.status = REQUEST_STATUS.REJECTED;
      closureRequest.reviewedBy = authUser._id;
      closureRequest.reviewedAt = new Date();
      closureRequest.adminRemarks = adminRemarks;
      await closureRequest.save();

      await Notification.create({
        userId: closureRequest.userId,
        title: "Account Closure Request Rejected",
        message: `Your request to close account ${account.accountNumber} was rejected. Reason: ${adminRemarks || "Does not meet closure criteria."}`,
        type: NOTIFICATION_TYPES.ACCOUNT_CLOSURE_REJECTED,
        link: "/customer/accounts",
      });

      await AuditLog.create({
        userId: authUser._id,
        userRole: authUser.role,
        action: "ACCOUNT_CLOSURE_REJECTED",
        category: "ACCOUNT",
        details: {
          requestId: closureRequest._id,
          accountId: account._id,
          reason: adminRemarks,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Account closure request for ${account.accountNumber} was rejected.`,
        data: closureRequest,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to review account closure request.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
