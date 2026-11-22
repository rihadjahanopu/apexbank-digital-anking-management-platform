import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { BankingSettings } from "@/models/BankingSettings";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, DEFAULT_BANKING_SETTINGS } from "@/lib/constants";

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await BankingSettings.findOne();
    if (!settings) {
      settings = await BankingSettings.create(DEFAULT_BANKING_SETTINGS);
    }
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load banking settings";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();

    let settings = await BankingSettings.findOne();
    if (!settings) {
      settings = await BankingSettings.create({
        ...DEFAULT_BANKING_SETTINGS,
        ...body,
        updatedBy: user._id,
      });
    } else {
      Object.assign(settings, body);
      settings.updatedBy = user._id;
      await settings.save();
    }

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "BANKING_SETTINGS_UPDATED",
      category: "SETTINGS",
      details: body,
    });

    return NextResponse.json({
      success: true,
      message: "Banking rules and thresholds updated successfully.",
      settings,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to save banking settings";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
