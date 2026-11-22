import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth, hashPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, USER_STATUS } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const status = url.searchParams.get("status")?.trim() || "";
    const roleFilter = url.searchParams.get("role")?.trim() || "ALL_TEAM";

    // Build filter query for staff and admin team members
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (roleFilter === ROLES.ADMIN) {
      query.role = ROLES.ADMIN;
    } else if (roleFilter === ROLES.STAFF) {
      query.role = ROLES.STAFF;
    } else {
      query.role = { $in: [ROLES.STAFF, ROLES.ADMIN] };
    }

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { nationalId: { $regex: search, $options: "i" } },
      ];
    }

    const staffMembers = await User.find(query).sort({ createdAt: -1 });

    // Aggregate stats across all internal team members (Staff + Admin)
    const allTeam = await User.find(
      { role: { $in: [ROLES.STAFF, ROLES.ADMIN] } },
      "role status"
    );

    const stats = {
      total: allTeam.length,
      admins: allTeam.filter((s) => s.role === ROLES.ADMIN).length,
      active: allTeam.filter(
        (s) => s.status === USER_STATUS.ACTIVE && s.role === ROLES.STAFF
      ).length,
      inactive: allTeam.filter((s) => s.status === USER_STATUS.INACTIVE).length,
      blocked: allTeam.filter((s) => s.status === USER_STATUS.BLOCKED).length,
    };

    return NextResponse.json({
      success: true,
      staff: staffMembers,
      stats,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load staff list";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req, [ROLES.ADMIN]);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const { name, email, password, phone, nationalId, address, role = ROLES.STAFF } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const assignedRole = role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.STAFF;
    const tempPassword = password || "StaffOfficer123!";
    const hashedPassword = await hashPassword(tempPassword);
    const defaultPin = await hashPassword("1234");

    const staff = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: assignedRole,
      status: USER_STATUS.ACTIVE,
      phone: phone?.trim(),
      nationalId: nationalId?.trim(),
      address: address?.trim(),
      transactionPin: defaultPin,
      isVerified: true,
    });

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: assignedRole === ROLES.ADMIN ? "ADMIN_PROVISIONED_ADMIN" : "ADMIN_PROVISIONED_STAFF",
      category: "AUTH",
      details: {
        staffId: staff._id,
        email: staff.email,
        name: staff.name,
        role: assignedRole,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${assignedRole === ROLES.ADMIN ? "Administrator" : "Staff member"} ${staff.name} provisioned successfully.`,
      staff,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to provision staff";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
