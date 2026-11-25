"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, UserCheck, UserPlus, Eye, FileCheck } from "lucide-react";
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
  useVerifyCustomerKycMutation,
} from "@/redux/api/customersApi";
import { ROLES, USER_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { IUser } from "@/types";

export default function StaffCustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<IUser | null>(null);

  const { data, isLoading } = useGetCustomersQuery({
    search,
    status: statusFilter,
    page,
    limit: 15,
  });

  const [verifyKycMutation, { isLoading: isVerifying }] =
    useVerifyCustomerKycMutation();

  const customers = data?.customers || [];
  const totalPages = data?.totalPages || 1;

  const handleToggleKyc = async (customer: IUser) => {
    try {
      const res = await verifyKycMutation({
        id: customer._id,
        isVerified: !customer.isVerified,
      }).unwrap();
      toast.success(res.message || "KYC updated.");
      if (selectedCustomer && selectedCustomer._id === customer._id) {
        setSelectedCustomer((prev) =>
          prev ? { ...prev, isVerified: !prev.isVerified } : null
        );
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "KYC update failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Customer Registry & KYC Desk
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verify customer identities, check compliance documents, and inspect depository standings.
            </p>
          </div>

          <Link href="/staff/customers/register">
            <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
              Onboard New Customer
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="Search by customer name, email, or national ID..."
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

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="h-7 w-7" />}
              title="No customers found"
              description="No registered customer profiles matched your criteria."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone / SSN</TableHead>
                  <TableHead>KYC Clearance</TableHead>
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
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-xs font-bold text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{c.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {c.phone || "No phone"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
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
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(c)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={c.isVerified ? "outline" : "primary"}
                          size="sm"
                          disabled={isVerifying}
                          onClick={() => handleToggleKyc(c)}
                          leftIcon={<FileCheck className="h-3.5 w-3.5" />}
                        >
                          {c.isVerified ? "Revoke" : "Verify KYC"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

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

        {/* Customer Dossier Modal */}
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title="Customer Dossier & KYC Inspection"
          description={`Verified customer records for ${selectedCustomer?.name || ""}`}
          maxWidth="lg"
        >
          {selectedCustomer && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Legal Name</span>
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
                  <span className="text-slate-400 block">Contact Phone</span>
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
                  <Badge variant={selectedCustomer.isVerified ? "success" : "warning"}>
                    KYC {selectedCustomer.isVerified ? "Verified" : "Pending"}
                  </Badge>
                  <Badge variant="outline">{selectedCustomer.status}</Badge>
                </div>

                <Button
                  variant={selectedCustomer.isVerified ? "outline" : "primary"}
                  size="sm"
                  disabled={isVerifying}
                  onClick={() => handleToggleKyc(selectedCustomer)}
                  leftIcon={<FileCheck className="h-3.5 w-3.5" />}
                >
                  {selectedCustomer.isVerified ? "Revoke Verification" : "Authorize KYC Verification"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
