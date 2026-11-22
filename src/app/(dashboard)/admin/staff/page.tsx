"use client";

import React, { useState } from "react";
import {
  UserPlus,
  UserCog,
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Clock,
  KeyRound,
  Trash2,
  MoreVertical,
  Search,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Briefcase,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Input,
  Modal,
  EmptyState,
  StatCard,
  Dropdown,
  Select,
} from "@/components/ui";
import { ROLES, USER_STATUS, UserRole, UserStatus } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { IUser } from "@/types";
import { useAppSelector } from "@/redux/hooks";
import {
  useGetStaffListQuery,
  useCreateStaffMutation,
  useUpdateStaffStatusMutation,
  useUpdateStaffMutation,
  useChangeUserRoleMutation,
  useDeleteStaffMutation,
} from "@/redux/api/staffApi";

export default function AdminStaffPage() {
  const { user: currentAdmin } = useAppSelector((state) => state.auth);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL_TEAM");

  // RTK Query hooks
  const { data, isLoading, refetch, isFetching } = useGetStaffListQuery({
    search: search.trim() || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    role: roleFilter !== "ALL_TEAM" ? roleFilter : undefined,
  });

  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaffStatus, { isLoading: isUpdatingStatus }] =
    useUpdateStaffStatusMutation();
  const [changeUserRole, { isLoading: isChangingRole }] =
    useChangeUserRoleMutation();
  const [updateStaff, { isLoading: isUpdatingStaff }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: isDeletingStaff }] = useDeleteStaffMutation();

  const staffList = data?.staff || [];
  const stats = data?.stats || {
    total: 0,
    admins: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
  };

  // Modals state
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("StaffOfficer123!");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [address, setAddress] = useState("");
  const [provisionRole, setProvisionRole] = useState<UserRole>(ROLES.STAFF);

  // Status Change Modal
  const [statusTarget, setStatusTarget] = useState<{
    staff: IUser;
    targetStatus: UserStatus;
  } | null>(null);
  const [statusReason, setStatusReason] = useState("");

  // Role Change Modal
  const [roleTarget, setRoleTarget] = useState<IUser | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>(ROLES.ADMIN);
  const [roleReason, setRoleReason] = useState("");

  // Reset Password Modal
  const [passwordTarget, setPasswordTarget] = useState<IUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState<IUser | null>(null);

  // Generate strong random password
  const generateStrongPassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Handle Provisioning
  const handleProvisionStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    try {
      const res = await createStaff({
        name: name.trim(),
        email: email.trim(),
        password: password || undefined,
        phone: phone.trim() || undefined,
        nationalId: nationalId.trim() || undefined,
        address: address.trim() || undefined,
        role: provisionRole,
      }).unwrap();

      toast.success(
        res.message ||
          `${provisionRole === ROLES.ADMIN ? "Administrator" : "Staff officer"} provisioned successfully!`
      );
      setIsProvisionOpen(false);
      setName("");
      setEmail("");
      setPassword("StaffOfficer123!");
      setPhone("");
      setNationalId("");
      setAddress("");
      setProvisionRole(ROLES.STAFF);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to provision team member.");
    }
  };

  // Handle Role Change / Promotion
  const handleConfirmRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTarget) return;

    if (roleTarget._id === currentAdmin?._id) {
      toast.error("You cannot modify your own administrator role.");
      return;
    }

    try {
      const res = await changeUserRole({
        id: roleTarget._id,
        role: targetRole,
        reason: roleReason.trim() || undefined,
      }).unwrap();

      toast.success(res.message || "User role updated successfully.");
      setRoleTarget(null);
      setRoleReason("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to change user role.");
    }
  };

  // Handle Status Update
  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    try {
      const res = await updateStaffStatus({
        id: statusTarget.staff._id,
        status: statusTarget.targetStatus,
        reason: statusReason.trim() || undefined,
      }).unwrap();

      toast.success(res.message || "Officer status updated successfully.");
      setStatusTarget(null);
      setStatusReason("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to update officer status.");
    }
  };

  // Handle Password Reset
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTarget) return;

    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    try {
      const res = await updateStaff({
        id: passwordTarget._id,
        newPassword,
      }).unwrap();

      toast.success(res.message || "Password reset successfully.");
      setPasswordTarget(null);
      setNewPassword("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to reset password.");
    }
  };

  // Handle Deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget._id === currentAdmin?._id) {
      toast.error("You cannot delete your own admin account.");
      return;
    }

    try {
      const res = await deleteStaff(deleteTarget._id).unwrap();
      toast.success(res.message || "Officer deleted permanently.");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to delete officer.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Staff & Administrators Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage operational staff officers, promote users to Super Administrators, suspend accounts, and configure permissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<UserPlus className="h-4 w-4" />}
              size="sm"
              onClick={() => {
                setPassword(generateStrongPassword());
                setProvisionRole(ROLES.STAFF);
                setIsProvisionOpen(true);
              }}
            >
              Provision New Officer
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Team"
            value={stats.total}
            icon={<UserCog className="h-5 w-5" />}
            subtitle="Admins & branch staff"
            iconBgColor="bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400"
          />
          <StatCard
            title="Super Admins"
            value={stats.admins}
            icon={<Crown className="h-5 w-5" />}
            subtitle="Root banking authority"
            iconBgColor="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
          />
          <StatCard
            title="Active Staff"
            value={stats.active}
            icon={<CheckCircle2 className="h-5 w-5" />}
            subtitle="Operational desk officers"
            iconBgColor="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            title="Blocked / Suspended"
            value={stats.inactive + stats.blocked}
            icon={<Ban className="h-5 w-5" />}
            subtitle="Deactivated access"
            iconBgColor="bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
          />
        </div>

        {/* Filter & Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search by name, email, phone..."
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-48">
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  options={[
                    { value: "ALL_TEAM", label: "All Roles (Team)" },
                    { value: ROLES.ADMIN, label: "Super Admins Only" },
                    { value: ROLES.STAFF, label: "Staff Officers Only" },
                  ]}
                />
              </div>

              <div className="w-full sm:w-48">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "All Statuses" },
                    { value: USER_STATUS.ACTIVE, label: "Active" },
                    {
                      value: USER_STATUS.INACTIVE,
                      label: "Temporarily Blocked",
                    },
                    {
                      value: USER_STATUS.BLOCKED,
                      label: "Permanently Blocked",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Staff Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading team members...
            </div>
          ) : staffList.length === 0 ? (
            <EmptyState
              icon={<UserCog className="h-7 w-7" />}
              title="No team members found"
              description={
                search || statusFilter !== "ALL" || roleFilter !== "ALL_TEAM"
                  ? "No team members matched your search or status filter."
                  : "Click the button above to provision your first Bank Staff officer or Admin."
              }
              actionLabel="Provision Officer"
              onAction={() => {
                setPassword(generateStrongPassword());
                setIsProvisionOpen(true);
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer / Administrator</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Phone / ID</TableHead>
                  <TableHead>Role Clearance</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Date Appointed</TableHead>
                  <TableHead className="text-right">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.map((st) => {
                  const isAdmin = st.role === ROLES.ADMIN;
                  const isStaff = st.role === ROLES.STAFF;
                  const isSelf = st._id === currentAdmin?._id;
                  const isActive = st.status === USER_STATUS.ACTIVE;
                  const isInactive = st.status === USER_STATUS.INACTIVE;
                  const isBlocked = st.status === USER_STATUS.BLOCKED;

                  const dropdownItems = [];

                  // Role Management: Promote / Demote
                  if (!isSelf) {
                    if (isStaff) {
                      dropdownItems.push({
                        label: "Promote to Super Admin",
                        icon: <Crown className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
                        onClick: () => {
                          setRoleTarget(st);
                          setTargetRole(ROLES.ADMIN);
                          setRoleReason("");
                        },
                      });
                    } else if (isAdmin) {
                      dropdownItems.push({
                        label: "Demote to Staff Officer",
                        icon: <Briefcase className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
                        onClick: () => {
                          setRoleTarget(st);
                          setTargetRole(ROLES.STAFF);
                          setRoleReason("");
                        },
                      });
                    }

                    dropdownItems.push({
                      label: "Change User Role",
                      icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
                      onClick: () => {
                        setRoleTarget(st);
                        setTargetRole(isAdmin ? ROLES.STAFF : ROLES.ADMIN);
                        setRoleReason("");
                      },
                    });
                  }

                  // Status actions: Activate / Unblock
                  if (!isActive) {
                    dropdownItems.push({
                      label: "Activate / Unblock Account",
                      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                      onClick: () =>
                        setStatusTarget({
                          staff: st,
                          targetStatus: USER_STATUS.ACTIVE,
                        }),
                    });
                  }

                  // Temporary Block (Suspend)
                  if (!isInactive && !isSelf) {
                    dropdownItems.push({
                      label: "Temporary Block (Suspend)",
                      icon: <Clock className="h-4 w-4 text-amber-500" />,
                      onClick: () =>
                        setStatusTarget({
                          staff: st,
                          targetStatus: USER_STATUS.INACTIVE,
                        }),
                    });
                  }

                  // Permanent Block
                  if (!isBlocked && !isSelf) {
                    dropdownItems.push({
                      label: "Permanent Block",
                      icon: <Ban className="h-4 w-4 text-rose-500" />,
                      onClick: () =>
                        setStatusTarget({
                          staff: st,
                          targetStatus: USER_STATUS.BLOCKED,
                        }),
                    });
                  }

                  // Reset password option
                  dropdownItems.push({
                    label: "Reset Password",
                    icon: <KeyRound className="h-4 w-4 text-indigo-500" />,
                    onClick: () => {
                      setPasswordTarget(st);
                      setNewPassword(generateStrongPassword());
                    },
                  });

                  // Delete option (disabled for self)
                  if (!isSelf) {
                    dropdownItems.push({
                      label: "Delete Officer Account",
                      icon: <Trash2 className="h-4 w-4 text-rose-600" />,
                      danger: true,
                      onClick: () => setDeleteTarget(st),
                    });
                  }

                  return (
                    <TableRow key={st._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {st.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={st.avatarUrl}
                              alt={st.name}
                              className="h-9 w-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                            />
                          ) : (
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shrink-0 ${
                              isAdmin ? "bg-indigo-600" : "bg-sky-600"
                            }`}>
                              {st.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                {st.name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {st.address || (isAdmin ? "Corporate HQ" : "Branch Desk")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300">
                        {st.email}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        <div>{st.phone || "No phone"}</div>
                        {st.nationalId && (
                          <div className="text-[10px] text-slate-400">
                            ID: {st.nationalId}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Badge variant="primary" size="sm" dot>
                            SUPER ADMIN
                          </Badge>
                        ) : (
                          <Badge variant="info" size="sm" dot>
                            STAFF OFFICER
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isActive && (
                          <Badge variant="success" size="sm" dot>
                            ACTIVE
                          </Badge>
                        )}
                        {isInactive && (
                          <Badge variant="warning" size="sm" dot>
                            TEMP BLOCKED
                          </Badge>
                        )}
                        {isBlocked && (
                          <Badge variant="danger" size="sm" dot>
                            BLOCKED
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatDate(st.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dropdown
                          align="right"
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                            </Button>
                          }
                          items={dropdownItems}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Provision Modal */}
        <Modal
          isOpen={isProvisionOpen}
          onClose={() => setIsProvisionOpen(false)}
          title="Provision New Bank Officer / Admin"
          description="Create a credentialed team account with branch operational authority or full admin rights."
        >
          <form onSubmit={handleProvisionStaff} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Assign System Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvisionRole(ROLES.STAFF)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    provisionRole === ROLES.STAFF
                      ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 ring-2 ring-sky-500/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900"
                  }`}
                >
                  <Briefcase className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Staff Officer</p>
                    <p className="text-[10px] text-slate-500">Branch desk & review authority</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProvisionRole(ROLES.ADMIN)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    provisionRole === ROLES.ADMIN
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900"
                  }`}
                >
                  <Crown className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Super Admin</p>
                    <p className="text-[10px] text-slate-500">Full core banking authority</p>
                  </div>
                </button>
              </div>
            </div>

            <Input
              label="Officer Full Name"
              placeholder="e.g. Elena Rostova"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Corporate Email Address"
              type="email"
              placeholder="e.g. elena@apexbank.com"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Initial Password
                </span>
                <button
                  type="button"
                  onClick={() => setPassword(generateStrongPassword())}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Generate Strong
                </button>
              </div>
              <Input
                type="text"
                leftIcon={<Lock className="h-4 w-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Direct Phone Number"
                placeholder="+1 (555) 018-9921"
                leftIcon={<Phone className="h-4 w-4" />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="National ID / Badge Number"
                placeholder="BD-8839201"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
              />
            </div>

            <Input
              label="Assigned Branch / Location"
              placeholder="e.g. Dhaka Main Branch / Desk #4"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsProvisionOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={isCreating}>
                Provision {provisionRole === ROLES.ADMIN ? "Administrator" : "Staff"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Role Change Modal */}
        <Modal
          isOpen={!!roleTarget}
          onClose={() => {
            setRoleTarget(null);
            setRoleReason("");
          }}
          title={`Modify System Role for ${roleTarget?.name}`}
          description={`Select the new banking clearance level for ${roleTarget?.email}.`}
        >
          <form onSubmit={handleConfirmRoleChange} className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Authorization & Security Policy</p>
                <p className="leading-relaxed">
                  Promoting an officer to <strong>Super Administrator</strong> grants full control over banking rules, staff accounts, transaction approvals, and immutable audit logs.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Target Role Clearance
              </label>
              <div className="space-y-2">
                {[
                  {
                    role: ROLES.ADMIN,
                    title: "Super Administrator",
                    desc: "Full core protocol clearance, staff management & rule settings",
                    icon: <Crown className="h-4 w-4 text-indigo-600" />,
                  },
                  {
                    role: ROLES.STAFF,
                    title: "Bank Staff Officer",
                    desc: "Branch desk operations, KYC reviews, loan/card approvals",
                    icon: <Briefcase className="h-4 w-4 text-sky-600" />,
                  },
                  {
                    role: ROLES.CUSTOMER,
                    title: "Customer Account",
                    desc: "Standard retail digital banking customer without internal desk clearance",
                    icon: <User className="h-4 w-4 text-slate-600" />,
                  },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setTargetRole(item.role)}
                    className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      targetRole === item.role
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </span>
                        {roleTarget?.role === item.role && (
                          <Badge variant="outline" size="sm">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Administrative Reason / Note"
              placeholder="e.g. Promoted to Senior Branch Manager / Security Officer..."
              value={roleReason}
              onChange={(e) => setRoleReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setRoleTarget(null);
                  setRoleReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                type="submit"
                isLoading={isChangingRole}
              >
                Apply Role Change
              </Button>
            </div>
          </form>
        </Modal>

        {/* Status Change Confirmation Modal */}
        <Modal
          isOpen={!!statusTarget}
          onClose={() => {
            setStatusTarget(null);
            setStatusReason("");
          }}
          title={
            statusTarget?.targetStatus === USER_STATUS.ACTIVE
              ? "Activate Team Member Account"
              : statusTarget?.targetStatus === USER_STATUS.INACTIVE
              ? "Temporarily Block / Suspend Officer"
              : "Permanently Block Officer"
          }
          description={`Review status modification for ${statusTarget?.staff.name} (${statusTarget?.staff.email}).`}
        >
          <form onSubmit={handleConfirmStatusChange} className="space-y-4 pt-2">
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                statusTarget?.targetStatus === USER_STATUS.ACTIVE
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : statusTarget?.targetStatus === USER_STATUS.INACTIVE
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
              }`}
            >
              {statusTarget?.targetStatus === USER_STATUS.ACTIVE ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusTarget?.targetStatus === USER_STATUS.INACTIVE ? (
                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">
                {statusTarget?.targetStatus === USER_STATUS.ACTIVE && (
                  <p>
                    Activating this account will immediately restore active credentials and grant internal banking access.
                  </p>
                )}
                {statusTarget?.targetStatus === USER_STATUS.INACTIVE && (
                  <p>
                    Temporarily blocking (suspending) will invalidate active sessions and prevent the officer from signing in or approving transactions. You can re-activate the account at any time.
                  </p>
                )}
                {statusTarget?.targetStatus === USER_STATUS.BLOCKED && (
                  <p>
                    Permanently blocking will completely lock this account. The officer will be immediately barred from accessing any internal banking functions.
                  </p>
                )}
              </div>
            </div>

            <Input
              label="Reason or Administrative Notes"
              placeholder="e.g. Annual leave, security compliance review, role reassignment..."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setStatusTarget(null);
                  setStatusReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant={
                  statusTarget?.targetStatus === USER_STATUS.BLOCKED
                    ? "danger"
                    : statusTarget?.targetStatus === USER_STATUS.INACTIVE
                    ? "secondary"
                    : "primary"
                }
                type="submit"
                isLoading={isUpdatingStatus}
              >
                {statusTarget?.targetStatus === USER_STATUS.ACTIVE
                  ? "Activate Account"
                  : statusTarget?.targetStatus === USER_STATUS.INACTIVE
                  ? "Suspend Officer"
                  : "Block Officer"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Reset Password Modal */}
        <Modal
          isOpen={!!passwordTarget}
          onClose={() => {
            setPasswordTarget(null);
            setNewPassword("");
          }}
          title="Reset Officer Password"
          description={`Assign a new secure password for ${passwordTarget?.name} (${passwordTarget?.email}).`}
        >
          <form onSubmit={handleConfirmPasswordReset} className="space-y-4 pt-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  New Password
                </span>
                <button
                  type="button"
                  onClick={() => setNewPassword(generateStrongPassword())}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Generate Strong
                </button>
              </div>
              <Input
                type="text"
                leftIcon={<Lock className="h-4 w-4" />}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setPasswordTarget(null);
                  setNewPassword("");
                }}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={isUpdatingStaff}>
                Update Password
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Permanently Delete Officer"
          description="Confirm permanent removal of this account from the bank."
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                <p className="font-semibold mb-0.5">Destructive Action</p>
                <p>
                  You are about to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}). All enrolled biometric passkeys and officer login credentials will be permanently erased. Past compliance logs and transactions reviewed by this officer will be preserved.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={isDeletingStaff}
                onClick={handleConfirmDelete}
              >
                Permanently Delete Officer
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
