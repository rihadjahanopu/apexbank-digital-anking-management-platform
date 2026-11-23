import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { BankAccount } from "@/models/BankAccount";
import { Transaction } from "@/models/Transaction";
import { Notification } from "@/models/Notification";
import { AuditLog } from "@/models/AuditLog";
import {
  ROLES,
  ACCOUNT_STATUS,
  TRANSACTION_STATUS,
  NOTIFICATION_TYPES,
} from "@/lib/constants";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    // Allow both ADMIN and STAFF to review and change status (active/frozen/closed)
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { status, reason } = body;

    if (!Object.values(ACCOUNT_STATUS).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid account status." },
        { status: 400 }
      );
    }

    const previousAccount = await BankAccount.findById(id);
    if (!previousAccount) {
      return NextResponse.json(
        { success: false, error: "Bank account not found." },
        { status: 404 }
      );
    }

    const wasPending = previousAccount.status === ACCOUNT_STATUS.PENDING;

    // Update object
    const updateData: Record<string, unknown> = { status };
    // If activating a pending account, make the balance available
    if (status === ACCOUNT_STATUS.ACTIVE && wasPending) {
      updateData.availableBalance = previousAccount.balance;
    }

    const updated = await BankAccount.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Bank account not found." },
        { status: 404 }
      );
    }

    // If activating a previously pending account:
    if (status === ACCOUNT_STATUS.ACTIVE && wasPending) {
      // Complete initial deposit transaction if pending
      await Transaction.updateMany(
        {
          receiverAccount: updated._id,
          status: TRANSACTION_STATUS.PENDING,
          reference: `OPENING-DEP-${updated.accountNumber}`,
        },
        {
          status: TRANSACTION_STATUS.COMPLETED,
          approvedBy: user._id,
        }
      );

      // Notify customer that account is active
      await Notification.create({
        userId: updated.userId,
        title: "Bank Account Activated!",
        message: `Your depository account #${updated.accountNumber} has been verified and approved by bank staff officer ${user.name}. Your account and funds are now fully active!`,
        type: NOTIFICATION_TYPES.ACCOUNT_ACTIVATED || "ACCOUNT_ACTIVATED",
        link: "/customer/dashboard",
      });
    } else if (status === ACCOUNT_STATUS.CLOSED) {
      await Notification.create({
        userId: updated.userId,
        title: "Bank Account Closed / Rejected",
        message: `Your depository account #${updated.accountNumber} status has been set to CLOSED.${
          reason ? ` Note: ${reason}` : ""
        }`,
        type: NOTIFICATION_TYPES.ACCOUNT_REJECTED || "ACCOUNT_REJECTED",
        link: "/customer/accounts",
      });
    } else if (status === ACCOUNT_STATUS.FROZEN) {
      await Notification.create({
        userId: updated.userId,
        title: "Bank Account Frozen",
        message: `Your depository account #${updated.accountNumber} has been temporarily FROZEN.${
          reason ? ` Note: ${reason}` : ""
        }`,
        type: NOTIFICATION_TYPES.ACCOUNT_FROZEN,
        link: "/customer/accounts",
      });
    }

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: `ACCOUNT_STATUS_CHANGED_TO_${status}`,
      category: "ACCOUNT",
      details: {
        accountId: id,
        accountNumber: updated.accountNumber,
        previousStatus: previousAccount.status,
        newStatus: status,
        reason,
        reviewedBy: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        status === ACCOUNT_STATUS.ACTIVE && wasPending
          ? `Account #${updated.accountNumber} has been reviewed and successfully activated!`
          : `Account #${updated.accountNumber} status set to ${status}.`,
      account: updated,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update account status";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
