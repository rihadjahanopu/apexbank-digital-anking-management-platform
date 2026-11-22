"use client";

import React, { useState } from "react";
import {
  Wallet,
  Search,
  Lock,
  Unlock,
  Sliders,
  XCircle,
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
  useGetAccountsQuery,
  useUpdateAccountStatusMutation,
  useUpdateAccountLimitsMutation,
} from "@/redux/api/accountsApi";
import { ROLES, ACCOUNT_TYPES, ACCOUNT_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { IBankAccount, IUser } from "@/types";

export default function AdminAccountsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limitModalAccount, setLimitModalAccount] = useState<IBankAccount | null>(null);
  const [dailyLimitInput, setDailyLimitInput] = useState<number>(10000);
  const [minBalanceInput, setMinBalanceInput] = useState<number>(50);

  const { data, isLoading } = useGetAccountsQuery({
    search,
    type: typeFilter,
    status: statusFilter,
    page,
    limit: 10,
  });

  const [updateStatusMutation, { isLoading: isUpdatingStatus }] =
    useUpdateAccountStatusMutation();
  const [updateLimitsMutation, { isLoading: isUpdatingLimits }] =
    useUpdateAccountLimitsMutation();

  const accounts = data?.accounts || [];
  const totalPages = data?.totalPages || 1;

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await updateStatusMutation({
        id,
        status: newStatus,
        reason: "Administrative governance",
      }).unwrap();
      toast.success(res.message || "Account status updated.");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to update account status.");
    }
  };

  const handleSaveLimits = async () => {
    if (!limitModalAccount) return;
    try {
      const res = await updateLimitsMutation({
        id: limitModalAccount._id,
        dailyTransferLimit: Number(dailyLimitInput),
        minimumBalance: Number(minBalanceInput),
      }).unwrap();
      toast.success(res.message || "Account limits updated.");
      setLimitModalAccount(null);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to update limits.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Bank Account Portfolio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comprehensive registry of customer depository vaults, liquidity standing, and risk freezes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Total Accounts: {data?.total ?? "..."}
            </span>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="Search by 10-digit account number..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Types" },
                  { value: ACCOUNT_TYPES.SAVINGS, label: "Savings" },
                  { value: ACCOUNT_TYPES.CURRENT, label: "Current" },
                  { value: ACCOUNT_TYPES.BUSINESS, label: "Business" },
                ]}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: ACCOUNT_STATUS.ACTIVE, label: "Active" },
                  { value: ACCOUNT_STATUS.FROZEN, label: "Frozen" },
                  { value: ACCOUNT_STATUS.CLOSED, label: "Closed" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Accounts Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading bank accounts...
            </div>
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-7 w-7" />}
              title="No bank accounts found"
              description="No depository accounts matched the active filter criteria."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Customer Owner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daily Limit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => {
                  const owner = acc.userId as IUser;
                  return (
                    <TableRow key={acc._id}>
                      <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {acc.accountNumber}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {owner?.name || "Unknown"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {owner?.email || ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" size="sm">
                          {acc.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(acc.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            acc.status === ACCOUNT_STATUS.ACTIVE
                              ? "success"
                              : acc.status === ACCOUNT_STATUS.FROZEN
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                          dot
                        >
                          {acc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {formatCurrency(acc.dailyTransferLimit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setLimitModalAccount(acc);
                              setDailyLimitInput(acc.dailyTransferLimit);
                              setMinBalanceInput(acc.minimumBalance);
                            }}
                            title="Edit Limits"
                          >
                            <Sliders className="h-3.5 w-3.5" />
                          </Button>
                          {acc.status === ACCOUNT_STATUS.ACTIVE ? (
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={isUpdatingStatus}
                              onClick={() =>
                                handleStatusChange(
                                  acc._id,
                                  ACCOUNT_STATUS.FROZEN
                                )
                              }
                              title="Freeze Account"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </Button>
                          ) : acc.status === ACCOUNT_STATUS.FROZEN ? (
                            <Button
                              variant="success"
                              size="sm"
                              disabled={isUpdatingStatus}
                              onClick={() =>
                                handleStatusChange(
                                  acc._id,
                                  ACCOUNT_STATUS.ACTIVE
                                )
                              }
                              title="Unfreeze Account"
                            >
                              <Unlock className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                          {acc.status !== ACCOUNT_STATUS.CLOSED && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isUpdatingStatus}
                              onClick={() =>
                                handleStatusChange(
                                  acc._id,
                                  ACCOUNT_STATUS.CLOSED
                                )
                              }
                              title="Close Account"
                              className="text-rose-500 hover:text-rose-600"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
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

        {/* Adjust Limits Modal */}
        <Modal
          isOpen={!!limitModalAccount}
          onClose={() => setLimitModalAccount(null)}
          title={`Configure Limits — Account #${limitModalAccount?.accountNumber || ""}`}
          description="Adjust the daily debit cap and mandatory balance reserve for this account."
        >
          <div className="space-y-4 pt-2">
            <Input
              label="Daily Outgoing Transfer Limit ($)"
              type="number"
              value={dailyLimitInput}
              onChange={(e) => setDailyLimitInput(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Minimum Required Balance ($)"
              type="number"
              value={minBalanceInput}
              onChange={(e) => setMinBalanceInput(parseFloat(e.target.value) || 0)}
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLimitModalAccount(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={isUpdatingLimits}
                onClick={handleSaveLimits}
              >
                Save Limits
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
