import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/User";
import { BankAccount } from "@/models/BankAccount";
import { Transaction } from "@/models/Transaction";
import { ROLES } from "@/lib/constants";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
      ROLES.STAFF,
    ]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const customer = await User.findById(id);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found." },
        { status: 404 }
      );
    }

    const accounts = await BankAccount.find({ userId: customer._id });
    const accountIds = accounts.map((a) => a._id);

    const transactions = await Transaction.find({
      $or: [
        { senderAccount: { $in: accountIds } },
        { receiverAccount: { $in: accountIds } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({
      success: true,
      customer,
      accounts,
      transactions,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load customer profile";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
