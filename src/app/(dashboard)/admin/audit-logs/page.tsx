"use client";

import React, { useState } from "react";
import { History, Filter } from "lucide-react";
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
  Select,
  EmptyState,
} from "@/components/ui";
import { useGetAuditLogsQuery } from "@/redux/api/auditApi";
import { ROLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { IUser } from "@/types";

export default function AdminAuditLogsPage() {
  const [category, setCategory] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetAuditLogsQuery({
    category,
    page,
    limit: 20,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case "AUTH":
        return "primary";
      case "TRANSACTION":
        return "success";
      case "ACCOUNT":
        return "info";
      case "LOAN":
        return "warning";
      case "SETTINGS":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              System Audit Trail
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Immutable forensic logging of every administrative action, customer status change, and security event.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Total Logged Events: {data?.total ?? "..."}
            </span>
          </div>
        </div>

        {/* Category Filter */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <div className="w-56">
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Audit Categories" },
                  { value: "AUTH", label: "Authentication" },
                  { value: "TRANSACTION", label: "Transactions" },
                  { value: "ACCOUNT", label: "Accounts" },
                  { value: "LOAN", label: "Loans" },
                  { value: "CUSTOMER", label: "Customer Profile" },
                  { value: "SETTINGS", label: "System Settings" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<History className="h-7 w-7" />}
              title="No audit events found"
              description="No security or governance events match the chosen category."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Initiator</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const initiator = log.userId as IUser;
                  return (
                    <TableRow key={log._id}>
                      <TableCell className="text-xs text-slate-500 font-mono whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getCategoryBadgeVariant(log.category)}
                          size="sm"
                        >
                          {log.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {log.action}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {initiator?.name || log.userRole || "System"}
                        </span>
                        {initiator?.email && (
                          <span className="block text-[10px] text-slate-400">
                            {initiator.email}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                        {log.details ? (
                          <span className="max-w-xs truncate block" title={JSON.stringify(log.details)}>
                            {JSON.stringify(log.details)}
                          </span>
                        ) : (
                          "—"
                        )}
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
      </div>
    </DashboardLayout>
  );
}
