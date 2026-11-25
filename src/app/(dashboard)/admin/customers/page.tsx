"use client";

import React, { useState } from "react";
import {
  Users,
  Search,
  CheckCircle2,
  Ban,
  Eye,
  FileCheck,
  ShieldAlert,
  Crown,
  Briefcase,
  UserCog,
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
  Select,
  Modal,
  EmptyState,
} from "@/components/ui";
import {
  useGetCustomersQuery,
  useUpdateCustomerStatusMutation,
  useVerifyCustomerKycMutation,
  useChangeCustomerRoleMutation,
} from "@/redux/api/customersApi";
import { ROLES, USER_STATUS, UserRole, UserStatus } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { IUser } from "@/types";

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<IUser | null>(null);

  const { data, isLoading } = useGetCustomersQuery({
    search,
    status: statusFilter,
    page,
    limit: 10,
  });

  const [updateStatusMutation, { isLoading: isUpdatingStatus }] =
    useUpdateCustomerStatusMutation();
  const [verifyKycMutation, { isLoading: isVerifyingKyc }] =
    useVerifyCustomerKycMutation();
  const [changeRoleMutation, { isLoading: isChangingRole }] =
    useChangeCustomerRoleMutation();

  const [roleTarget, setRoleTarget] = useState<IUser | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>(ROLES.STAFF);
  const [roleReason, setRoleReason] = useState("");

  const customers = data?.customers || [];
  const totalPages = data?.totalPages || 1;

  const handleRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTarget) return;

    try {
      const res = await changeRoleMutation({
        id: roleTarget._id,
        role: targetRole,
        reason: roleReason.trim() || undefined,
      }).unwrap();

      toast.success(res.message || "Customer role updated successfully!");
      setRoleTarget(null);
      setRoleReason("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to change customer role.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await updateStatusMutation({
        id,
        status: newStatus,
        reason: "Admin governance action",
      }).unwrap();
      toast.success(res.message || "Customer status updated.");
      if (selectedCustomer && selectedCustomer._id === id) {
        setSelectedCustomer((prev) =>
          prev ? { ...prev, status: newStatus as UserStatus } : null
        );
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Status update failed.");
    }
  };

  const handleVerifyKyc = async (id: string, isVerified: boolean) => {
    try {
      const res = await verifyKycMutation({ id, isVerified }).unwrap();
      toast.success(res.message || "KYC updated.");
      if (selectedCustomer && selectedCustomer._id === id) {
        setSelectedCustomer((prev) =>
          prev ? { ...prev, isVerified } : null
        );
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Verification failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Customer Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Oversee registered banking customers, audit KYC verifications, and enforce account standing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Total Customers: {data?.total ?? "..."}
            </span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="Search by name, email, national ID, or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: USER_STATUS.ACTIVE, label: "Active" },
                  { value: USER_STATUS.INACTIVE, label: "Inactive" },
                  { value: USER_STATUS.BLOCKED, label: "Blocked" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Customer Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="No customers found"
              description="No registered customers match your search criteria."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact / ID</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Standing</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {c.name}
                          </div>
                          <div className="text-xs text-slate-400">{c.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {c.phone || "No phone"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {c.nationalId || "No ID"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.isVerified ? "success" : "warning"}
                        size="sm"
                        dot
                      >
                        {c.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === USER_STATUS.ACTIVE
                            ? "success"
                            : c.status === USER_STATUS.BLOCKED
                            ? "danger"
                            : "default"
                        }
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(c)}
                          title="View Customer Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRoleTarget(c);
                            setTargetRole(ROLES.STAFF);
                            setRoleReason("");
                          }}
                          title="Promote / Change Role"
                        >
                          <UserCog className="h-4 w-4 text-indigo-500" />
                        </Button>
                        {c.status === USER_STATUS.ACTIVE ? (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={isUpdatingStatus}
                            onClick={() =>
                              handleStatusChange(c._id, USER_STATUS.BLOCKED)
                            }
                            title="Block Customer"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            disabled={isUpdatingStatus}
                            onClick={() =>
                              handleStatusChange(c._id, USER_STATUS.ACTIVE)
                            }
                            title="Activate Customer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Customer Profile Modal */}
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title="Customer Profile Dossier"
          description={`Comprehensive profile records for ${selectedCustomer?.name || ""}`}
          maxWidth="lg"
        >
          {selectedCustomer && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Full Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.phone || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">National ID / SSN</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {selectedCustomer.nationalId || "N/A"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Residential Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.address || "N/A"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={selectedCustomer.isVerified ? "success" : "warning"}
                  >
                    KYC {selectedCustomer.isVerified ? "Verified" : "Pending"}
                  </Badge>
                  <Badge
                    variant={
                      selectedCustomer.status === USER_STATUS.ACTIVE
                        ? "success"
                        : "danger"
                    }
                  >
                    {selectedCustomer.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedCustomer.isVerified ? "outline" : "primary"}
                    size="sm"
                    disabled={isVerifyingKyc}
                    onClick={() =>
                      handleVerifyKyc(
                        selectedCustomer._id,
                        !selectedCustomer.isVerified
                      )
                    }
                    leftIcon={<FileCheck className="h-3.5 w-3.5" />}
                  >
                    {selectedCustomer.isVerified ? "Revoke KYC" : "Verify KYC"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Change Role / Promote Customer */}
        <Modal
          isOpen={!!roleTarget}
          onClose={() => {
            setRoleTarget(null);
            setRoleReason("");
          }}
          title={`Promote / Change Role for ${roleTarget?.name}`}
          description={`Select the new banking authorization level for ${roleTarget?.email}.`}
        >
          <form onSubmit={handleRoleChange} className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Role Escalation Authority</p>
                <p className="leading-relaxed">
                  Promoting this customer to <strong>Bank Staff Officer</strong> or <strong>Super Administrator</strong> grants them internal desk clearance and authority within the bank.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Select Target Clearance
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
                    desc: "Branch desk operations, KYC reviews, loan & card approvals",
                    icon: <Briefcase className="h-4 w-4 text-sky-600" />,
                  },
                  {
                    role: ROLES.CUSTOMER,
                    title: "Retail Customer",
                    desc: "Standard retail digital banking customer account",
                    icon: <Users className="h-4 w-4 text-slate-600" />,
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
              label="Administrative Authorization Reason"
              placeholder="e.g. Appointed as Operations Branch Officer / Security Administrator..."
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
                Confirm Role Change
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
