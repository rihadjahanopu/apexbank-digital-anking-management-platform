"use client";

import React, { useState } from "react";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Select,
  Modal,
  EmptyState,
} from "@/components/ui";
import {
  useGetAllClosureRequestsQuery,
  useReviewAccountClosureMutation,
} from "@/redux/api/accountsApi";
import {
  UserRole,
  REQUEST_STATUS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { IAccountClosureRequest, IUser, IBankAccount } from "@/types";

interface AccountClosuresReviewViewProps {
  allowedRoles: UserRole[];
  pageTitle: string;
}

export const AccountClosuresReviewView: React.FC<AccountClosuresReviewViewProps> = ({
  allowedRoles,
  pageTitle,
}) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const queryParams: { status?: string; page: number; limit: number } = {
    page,
    limit: 20,
  };
  if (statusFilter !== "ALL") queryParams.status = statusFilter;

  const { data, isLoading } = useGetAllClosureRequestsQuery(queryParams);
  const [reviewMutation, { isLoading: isReviewing }] = useReviewAccountClosureMutation();

  const requests: IAccountClosureRequest[] = data?.data || [];
  const meta = data?.meta;

  const [selectedRequest, setSelectedRequest] = useState<IAccountClosureRequest | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");

  const handleReview = async (action: "APPROVE" | "REJECT") => {
    if (!selectedRequest) return;

    try {
      const res = await reviewMutation({
        id: selectedRequest._id,
        action,
        adminRemarks: adminRemarks.trim() || undefined,
      }).unwrap();

      toast.success(res.message);
      setSelectedRequest(null);
      setAdminRemarks("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Review submission failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={allowedRoles}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {pageTitle}
            </h1>
            <Badge variant="warning">Closure Governance</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review customer depository account closure requests, verify balance disbursement, and permanently seal accounts.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <Select
              label="Request Status"
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

        {/* Closure Requests Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading closure requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={<Wallet className="h-8 w-8 text-slate-400" />}
                  title="No closure requests found"
                  description="There are currently no customer account closure requests matching the filter."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance at Request</TableHead>
                    <TableHead>Payout Destination</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => {
                    const customer = req.userId as IUser;
                    const account = req.accountId as IBankAccount;

                    return (
                      <TableRow key={req._id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                              {customer?.name || "Customer"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {customer?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {account?.accountNumber || "N/A"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {account?.accountType}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(req.balance)}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-600 dark:text-slate-300">
                          {req.targetPayoutAccount || "Direct Cash / Zero Balance"}
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <span
                            className="text-xs text-slate-600 dark:text-slate-300 truncate block"
                            title={req.reason}
                          >
                            {req.reason}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              req.status === REQUEST_STATUS.APPROVED
                                ? "success"
                                : req.status === REQUEST_STATUS.REJECTED
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                            dot
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {formatDate(req.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === REQUEST_STATUS.PENDING ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(req);
                                setAdminRemarks("");
                              }}
                            >
                              Review
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {req.status === REQUEST_STATUS.APPROVED
                                ? "Closed"
                                : "Rejected"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>
              Page {meta.page} of {meta.totalPages} ({meta.total} total requests)
            </span>
            <div className="flex gap-2">
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
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Review Modal */}
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title="Review Account Closure Request"
          description="Verify account status, balance settlement, and authorize complete account termination."
        >
          {selectedRequest && (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-rose-200 dark:border-rose-950 p-3.5 space-y-2 bg-rose-50/50 dark:bg-rose-950/20 text-xs">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Permanent Account Termination Notice</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {(selectedRequest.accountId as IBankAccount)?.accountNumber} (
                    {(selectedRequest.accountId as IBankAccount)?.accountType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {(selectedRequest.userId as IUser)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recorded Balance:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(selectedRequest.balance)}
                  </span>
                </div>
                {selectedRequest.targetPayoutAccount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payout Target:</span>
                    <span className="font-mono font-bold text-indigo-500">
                      {selectedRequest.targetPayoutAccount}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-rose-200 dark:border-rose-900">
                  <span className="text-slate-500 block mb-1">Customer Reason:</span>
                  <p className="p-2 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 italic">
                    &ldquo;{selectedRequest.reason}&rdquo;
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Officer Review Remarks:
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g. Balance disbursed to customer savings account. Closed."
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isReviewing}
                  leftIcon={<XCircle className="h-4 w-4" />}
                  onClick={() => handleReview("REJECT")}
                >
                  Reject Request
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isReviewing}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => handleReview("APPROVE")}
                >
                  Approve & Close Account
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};
export default AccountClosuresReviewView;
