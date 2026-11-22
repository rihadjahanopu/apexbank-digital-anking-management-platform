"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wallet, Search, PlusCircle } from "lucide-react";
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
  EmptyState,
} from "@/components/ui";
import { useGetAccountsQuery } from "@/redux/api/accountsApi";
import { ROLES, ACCOUNT_TYPES, ACCOUNT_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { IUser } from "@/types";

export default function StaffAccountsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetAccountsQuery({
    search,
    type: typeFilter,
    status: statusFilter,
    page,
    limit: 15,
  });

  const accounts = data?.accounts || [];
  const totalPages = data?.totalPages || 1;

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Customer Depository Accounts
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Overview of all active and savings, current, and business vaults issued to customers.
            </p>
          </div>

          <Link href="/staff/accounts/create">
            <Button size="sm" leftIcon={<PlusCircle className="h-4 w-4" />}>
              Issue New Account
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="Search account number..."
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
              title="No accounts found"
              description="No depository accounts matched the search criteria."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Customer Owner</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Issued</TableHead>
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
                        <div className="text-[10px] text-slate-400">
                          {owner?.email}
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
                      <TableCell className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(acc.availableBalance)}
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
                      <TableCell className="text-right text-xs text-slate-500 font-mono">
                        {formatDate(acc.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

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
      </div>
    </DashboardLayout>
  );
}
