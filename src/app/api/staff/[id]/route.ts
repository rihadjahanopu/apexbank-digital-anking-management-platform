import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth, hashPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { Passkey } from "@/models/Passkey";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, USER_STATUS, UserRole, UserStatus } from "@/lib/constants";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const staff = await User.findOne({
      _id: id,
      role: { $in: [ROLES.STAFF, ROLES.ADMIN] },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Team member not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load team member details";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const staff = await User.findById(id).select("+password");

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    // Safety: only staff and admin accounts can be modified via this route
    if (staff.role !== ROLES.STAFF && staff.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Action allowed only on staff or administrator accounts." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, role, reason, newPassword, name, phone, address, nationalId } = body;

    // Safety: prevent modifying own role to avoid accidental lockout
    if (role && role !== staff.role && staff._id.toString() === user._id.toString()) {
      return NextResponse.json(
        { success: false, error: "You cannot change your own administrator role." },
        { status: 400 }
      );
    }

    let auditAction = "ADMIN_UPDATED_TEAM_MEMBER";
    const auditDetails: Record<string, unknown> = {
      staffId: staff._id,
      staffEmail: staff.email,
      staffName: staff.name,
    };

    // 1. Role Change (e.g. Promote to Admin, Demote to Staff)
    if (role && role !== staff.role) {
      const validRoles = Object.values(ROLES);
      if (!validRoles.includes(role as UserRole)) {
        return NextResponse.json(
          { success: false, error: "Invalid role specified." },
          { status: 400 }
        );
      }

      const prevRole = staff.role;
      staff.role = role as UserRole;
      auditDetails.previousRole = prevRole;
      auditDetails.newRole = role;

      if (role === ROLES.ADMIN) {
        auditAction = "ADMIN_PROMOTED_STAFF_TO_ADMIN";
        staff.isVerified = true;
      } else if (role === ROLES.STAFF) {
        auditAction = "ADMIN_CHANGED_USER_ROLE_TO_STAFF";
      } else if (role === ROLES.CUSTOMER) {
        auditAction = "ADMIN_DEMOTED_USER_TO_CUSTOMER";
      }
    }

    // 2. Status Update (ACTIVE, INACTIVE [Temp Block], BLOCKED [Permanent Block])
    if (status) {
      const validStatuses = Object.values(USER_STATUS);
      if (!validStatuses.includes(status as UserStatus)) {
        return NextResponse.json(
          { success: false, error: "Invalid status value provided." },
          { status: 400 }
        );
      }

      const prevStatus = staff.status;
      staff.status = status as UserStatus;
      auditDetails.previousStatus = prevStatus;
      auditDetails.newStatus = status;
      if (reason) auditDetails.reason = reason;

      if (status === USER_STATUS.BLOCKED) {
        auditAction = "ADMIN_BLOCKED_TEAM_MEMBER";
      } else if (status === USER_STATUS.INACTIVE) {
        auditAction = "ADMIN_TEMPORARILY_BLOCKED_TEAM_MEMBER";
      } else if (status === USER_STATUS.ACTIVE) {
        auditAction = "ADMIN_ACTIVATED_TEAM_MEMBER";
      }
    }

    // 3. Password Reset
    if (newPassword) {
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 8 characters." },
          { status: 400 }
        );
      }
      staff.password = await hashPassword(newPassword);
      auditAction = "ADMIN_RESET_PASSWORD";
      auditDetails.passwordReset = true;
    }

    // 4. Profile details
    if (name) staff.name = name.trim();
    if (phone !== undefined) staff.phone = phone.trim();
    if (address !== undefined) staff.address = address.trim();
    if (nationalId !== undefined) staff.nationalId = nationalId.trim();

    await staff.save();

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: auditAction,
      category: "AUTH",
      details: auditDetails,
    });

    let statusMessage = `User ${staff.name} profile updated.`;
    if (role === ROLES.ADMIN) {
      statusMessage = `Officer ${staff.name} has been promoted to Super Administrator!`;
    } else if (status === USER_STATUS.BLOCKED) {
      statusMessage = `Officer ${staff.name} has been permanently blocked.`;
    } else if (status === USER_STATUS.INACTIVE) {
      statusMessage = `Officer ${staff.name} has been temporarily blocked (suspended).`;
    } else if (status === USER_STATUS.ACTIVE) {
      statusMessage = `Officer ${staff.name} account is now active and unblocked.`;
    } else if (newPassword) {
      statusMessage = `Password for officer ${staff.name} was successfully reset.`;
    }

    return NextResponse.json({
      success: true,
      message: statusMessage,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        status: staff.status,
        phone: staff.phone,
        address: staff.address,
        nationalId: staff.nationalId,
        isVerified: staff.isVerified,
        avatarUrl: staff.avatarUrl,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update officer";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const { id } = await params;
    const staff = await User.findById(id);

    if (!staff) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    // Prevent deleting self (extra safety)
    if (staff._id.toString() === user._id.toString()) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own admin account." },
        { status: 400 }
      );
    }

    // Delete associated passkeys
    await Passkey.deleteMany({ userId: id });

    // Delete staff user
    await User.findByIdAndDelete(id);

    // Audit log
    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "ADMIN_DELETED_OFFICER",
      category: "AUTH",
      details: {
        staffId: staff._id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Account for ${staff.name} (${staff.email}) was permanently deleted.`,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete account";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
