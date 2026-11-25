"use client";

import React, { useState } from "react";
import { ArrowUpFromLine, CheckCircle2, XCircle } from "lucide-react";
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
  Modal,
  Input,
  Select,
  EmptyState,
} from "@/components/ui";
import {
  useGetWithdrawalRequestsQuery,
  useReviewWithdrawalRequestMutation,
} from "@/redux/api/transactionsApi";
import { ROLES, REQUEST_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { IBankAccount, IUser, IWithdrawalRequest } from "@/types";

export default function StaffWithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedReq, setSelectedReq] = useState<IWithdrawalRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [note, setNote] = useState("");

  const { data, isLoading } = useGetWithdrawalRequestsQuery({
    status: statusFilter,
    page,
    limit: 15,
  });

  const [reviewMutation, { isLoading: isReviewing }] =
    useReviewWithdrawalRequestMutation();

  const requests = data?.requests || [];
  const totalPages = data?.totalPages || 1;

  const handleExecuteReview = async () => {
    if (!selectedReq) return;
    try {
      const res = await reviewMutation({
        id: selectedReq._id,
        action: reviewAction,
        note,
      }).unwrap();
      toast.success(res.message || "Review action executed.");
      setSelectedReq(null);
      setNote("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Review execution failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Withdrawal Requests Queue
              </h1>
              <Badge variant="info">Branch Clearance</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit customer withdrawal authorizations, verify identity standing, and approve cash disbursements.
            </p>
          </div>

          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: REQUEST_STATUS.PENDING, label: "Pending Review" },
                { value: REQUEST_STATUS.APPROVED, label: "Approved" },
                { value: REQUEST_STATUS.REJECTED, label: "Rejected" },
              ]}
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading withdrawal requests...
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<ArrowUpFromLine className="h-7 w-7 text-amber-500" />}
              title="No withdrawal requests"
              description="No customer withdrawal requests match your filter."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Source Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const customer = r.userId as IUser;
                  const account = r.accountId as IBankAccount;
                  return (
                    <TableRow key={r._id}>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {customer?.name || "Unknown"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {customer?.email}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {account ? `Acc #${account.accountNumber}` : "N/A"}
                      </TableCell>
                      <TableCell className="font-bold text-rose-600 dark:text-rose-400">
                        -{formatCurrency(r.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {r.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === REQUEST_STATUS.APPROVED
                              ? "success"
                              : r.status === REQUEST_STATUS.PENDING
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                          dot
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {formatDateTime(r.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === REQUEST_STATUS.PENDING ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => {
                                setSelectedReq(r);
                                setReviewAction("APPROVE");
                              }}
                              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedReq(r);
                                setReviewAction("REJECT");
                              }}
                              leftIcon={<XCircle className="h-3.5 w-3.5" />}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Reviewed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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

        {/* Action Confirmation Modal */}
        <Modal
          isOpen={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title={
            reviewAction === "APPROVE"
              ? "Confirm Withdrawal Approval"
              : "Reject Withdrawal Request"
          }
          description={`Withdrawal amount: ${formatCurrency(
            selectedReq?.amount || 0
          )}`}
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {reviewAction === "APPROVE"
                ? "Approving will immediately debit the customer's account balance and post a completed withdrawal transaction record."
                : "Rejecting will dismiss the request without altering balances."}
            </p>
            <Input
              label="Reviewer Note (Optional)"
              placeholder="e.g. Identity verified at branch desk..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReq(null)}
              >
                Cancel
              </Button>
              <Button
                variant={reviewAction === "APPROVE" ? "success" : "danger"}
                size="sm"
                isLoading={isReviewing}
                onClick={handleExecuteReview}
              >
                {reviewAction === "APPROVE" ? "Authorize & Debit Funds" : "Reject Request"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
