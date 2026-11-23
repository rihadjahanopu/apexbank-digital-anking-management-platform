import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { BankAccount } from "@/models/BankAccount";
import { ROLES, ACCOUNT_STATUS } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session or expired token." },
        { status: 401 }
      );
    }

    const accountCount = await BankAccount.countDocuments({
      userId: user._id,
      status: { $ne: ACCOUNT_STATUS.CLOSED },
    });
    const hasAccount = user.role !== ROLES.CUSTOMER || accountCount > 0;

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        address: user.address,
        nationalId: user.nationalId,
        transactionPinSet: !!user.transactionPin,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        avatarUrl: user.avatarUrl,
        hasAccount,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Session error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
