import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { PinResetRequest } from "@/models/PinResetRequest";
import { BankAccount } from "@/models/BankAccount";
import { ROLES, REQUEST_STATUS } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.STAFF, ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "ALL";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (status !== "ALL") {
      filter.status = status;
    }

    const requests = await PinResetRequest.find(filter)
      .populate("userId", "name email phone role status")
      .populate("reviewedBy", "name role")
      .sort({ createdAt: -1 });

    // Fetch accounts for each user
    const userIds = requests.map((r) => r.userId?._id).filter(Boolean);
    const accounts = await BankAccount.find({ userId: { $in: userIds } }).select(
      "userId accountNumber accountType balance availableBalance status"
    );

    const enriched = requests.map((r) => {
      const uId = r.userId?._id?.toString();
      const userAccounts = accounts.filter((a) => a.userId.toString() === uId);
      return {
        ...r.toObject(),
        userAccounts,
      };
    });

    return NextResponse.json({
      success: true,
      requests: enriched,
      pendingCount: await PinResetRequest.countDocuments({ status: REQUEST_STATUS.PENDING }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load PIN reset requests";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
