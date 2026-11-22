import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, UserRole } from "@/lib/constants";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    // Only administrators can change user roles
    const { user: authUser, errorResponse } = await requireAuth(req, [
      ROLES.ADMIN,
    ]);
    if (errorResponse || !authUser) return errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { role, reason } = body;

    const validRoles = Object.values(ROLES);
    if (!role || !validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid role specified. Must be one of: ${validRoles.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Safety: prevent admin from changing their own role to avoid accidental lockout
    if (id === authUser._id.toString()) {
      return NextResponse.json(
        {
          success: false,
          error: "Security Policy: You cannot modify your own administrator role.",
        },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    const previousRole = targetUser.role;

    if (previousRole === role) {
      return NextResponse.json(
        {
          success: false,
          error: `User is already assigned the role: ${role}.`,
        },
        { status: 400 }
      );
    }

    // Update role
    targetUser.role = role as UserRole;

    // If elevated to Staff or Admin, ensure verified status is true
    if (role === ROLES.ADMIN || role === ROLES.STAFF) {
      targetUser.isVerified = true;
    }

    await targetUser.save();

    // Determine audit action
    let auditAction = "ADMIN_CHANGED_USER_ROLE";
    if (role === ROLES.ADMIN) {
      auditAction = "ADMIN_PROMOTED_USER_TO_ADMIN";
    } else if (role === ROLES.STAFF && previousRole === ROLES.CUSTOMER) {
      auditAction = "ADMIN_PROMOTED_CUSTOMER_TO_STAFF";
    } else if (role === ROLES.CUSTOMER) {
      auditAction = "ADMIN_DEMOTED_USER_TO_CUSTOMER";
    }

    await AuditLog.create({
      userId: authUser._id,
      userRole: authUser.role,
      action: auditAction,
      category: "AUTH",
      details: {
        targetUserId: targetUser._id,
        targetEmail: targetUser.email,
        targetName: targetUser.name,
        previousRole,
        newRole: role,
        reason: reason || "Administrative role adjustment by super admin",
      },
    });

    let message = `Role for ${targetUser.name} changed from ${previousRole} to ${role}.`;
    if (role === ROLES.ADMIN) {
      message = `User ${targetUser.name} (${targetUser.email}) has been granted Super Administrator privileges!`;
    } else if (role === ROLES.STAFF) {
      message = `User ${targetUser.name} is now a Bank Staff Officer with operational desk clearance.`;
    }

    return NextResponse.json({
      success: true,
      message,
      user: {
        _id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
        phone: targetUser.phone,
        address: targetUser.address,
        nationalId: targetUser.nationalId,
        isVerified: targetUser.isVerified,
        avatarUrl: targetUser.avatarUrl,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to change user role";
    console.error("Change user role error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
