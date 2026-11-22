"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, Ban } from "lucide-react";
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
  EmptyState,
} from "@/components/ui";
import {
  useGetSuspiciousTransactionsQuery,
  useReviewSuspiciousTransactionMutation,
} from "@/redux/api/transactionsApi";
import { ROLES } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { IBankAccount } from "@/types";

export default function AdminSuspiciousTransactionsPage() {
  const { data, isLoading } = useGetSuspiciousTransactionsQuery();
  const [reviewMutation, { isLoading: isReviewing }] =
    useReviewSuspiciousTransactionMutation();

  const transactions = data?.transactions || [];

  const handleReview = async (id: string, action: "DISMISS" | "BLOCK_ACCOUNT") => {
    try {
      const res = await reviewMutation({ id, action }).unwrap();
      toast.success(res.message || "Action executed successfully.");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Review action failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Suspicious Transactions Watch
            </h1>
            <Badge variant="danger" dot>
              Risk Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time fraud alerts triggered by abnormal velocity, threshold breaches, or risk indicators.
          </p>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Auditing risk queue...
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={<ShieldAlert className="h-7 w-7 text-emerald-500" />}
              title="All Clear — Zero Risk Alerts"
              description="No suspicious transactions or velocity breaches are currently flagged."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Trigger Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Sender Account</TableHead>
                  <TableHead>Receiver Account</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const sender = tx.senderAccount as IBankAccount;
                  const receiver = tx.receiverAccount as IBankAccount;
                  return (
                    <TableRow key={tx._id} className="bg-rose-50/20 dark:bg-rose-950/10">
                      <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {tx.transactionId}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>{tx.suspiciousReason || "Flagged by risk engine"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {sender ? sender.accountNumber : "Branch Deposit"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {receiver ? receiver.accountNumber : "Cash Outflow"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {formatDateTime(tx.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isReviewing}
                            onClick={() => handleReview(tx._id, "DISMISS")}
                            leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                          >
                            Dismiss Flag
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={isReviewing}
                            onClick={() => handleReview(tx._id, "BLOCK_ACCOUNT")}
                            leftIcon={<Ban className="h-3.5 w-3.5" />}
                          >
                            Freeze Sender
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
