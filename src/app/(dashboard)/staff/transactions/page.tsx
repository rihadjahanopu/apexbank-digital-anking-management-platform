"use client";

import React, { useState } from "react";
import { History, Search } from "lucide-react";
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
import { useGetTransactionsQuery } from "@/redux/api/transactionsApi";
import { ROLES, TRANSACTION_TYPES, TRANSACTION_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { IBankAccount } from "@/types";

export default function StaffTransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetTransactionsQuery({
    search,
    type: typeFilter,
    status: statusFilter,
    page,
    limit: 20,
  });

  const transactions = data?.transactions || [];
  const totalPages = data?.totalPages || 1;

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Branch Transactions Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit historical customer transactions, search by reference, and verify cleared balances.
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="Search transaction ID or memo..."
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
                  { value: TRANSACTION_TYPES.TRANSFER, label: "Transfer" },
                  { value: TRANSACTION_TYPES.DEPOSIT, label: "Deposit" },
                  { value: TRANSACTION_TYPES.WITHDRAWAL, label: "Withdrawal" },
                  {
                    value: TRANSACTION_TYPES.LOAN_DISBURSEMENT,
                    label: "Loan Disbursed",
                  },
                  {
                    value: TRANSACTION_TYPES.LOAN_REPAYMENT,
                    label: "Loan Repaid",
                  },
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
                  { value: TRANSACTION_STATUS.COMPLETED, label: "Completed" },
                  { value: TRANSACTION_STATUS.PENDING, label: "Pending" },
                  { value: TRANSACTION_STATUS.FAILED, label: "Failed" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={<History className="h-7 w-7" />}
              title="No transactions found"
              description="No ledger transactions match the filter."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sender Account</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const sender = tx.senderAccount as IBankAccount;
                  const receiver = tx.receiverAccount as IBankAccount;
                  return (
                    <TableRow key={tx._id}>
                      <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {tx.transactionId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" size="sm">
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {sender ? `#${sender.accountNumber}` : "Counter Inflow"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {receiver ? `#${receiver.accountNumber}` : "Cash Outflow"}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            tx.isSuspicious
                              ? "danger"
                              : tx.status === TRANSACTION_STATUS.COMPLETED
                              ? "success"
                              : "warning"
                          }
                          size="sm"
                          dot
                        >
                          {tx.isSuspicious ? "FLAGGED" : tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500 font-mono">
                        {formatDateTime(tx.createdAt)}
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
