import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Notification } from "@/models/Notification";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load notifications";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const { id, markAll = false } = body;

    if (markAll) {
      await Notification.updateMany(
        { userId: user._id, isRead: false },
        { isRead: true }
      );
    } else if (id) {
      await Notification.findOneAndUpdate(
        { _id: id, userId: user._id },
        { isRead: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifications updated.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update notifications";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
