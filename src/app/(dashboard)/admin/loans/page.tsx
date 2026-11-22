"use client";

import React, { useState } from "react";
import { Landmark, CheckCircle2, XCircle, Eye } from "lucide-react";
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
  useGetLoansQuery,
  useApproveLoanMutation,
  useRejectLoanMutation,
} from "@/redux/api/loansApi";
import { ROLES, LOAN_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { IUser, IBankAccount, ILoan } from "@/types";

export default function AdminLoansPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState<ILoan | null>(null);
  const [actionModal, setActionModal] = useState<"APPROVE" | "REJECT" | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useGetLoansQuery({
    status: statusFilter,
    page,
    limit: 15,
  });

  const [approveLoanMutation, { isLoading: isApproving }] =
    useApproveLoanMutation();
  const [rejectLoanMutation, { isLoading: isRejecting }] =
    useRejectLoanMutation();

  const loans = data?.loans || [];
  const totalPages = data?.totalPages || 1;

  const handleApprove = async () => {
    if (!selectedLoan) return;
    try {
      const res = await approveLoanMutation({
        id: selectedLoan._id,
        note: approvalNote,
      }).unwrap();
      toast.success(res.message || "Loan approved and funds disbursed!");
      setSelectedLoan(null);
      setActionModal(null);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Loan approval failed.");
    }
  };

  const handleReject = async () => {
    if (!selectedLoan) return;
    try {
      const res = await rejectLoanMutation({
        id: selectedLoan._id,
        reason: rejectReason,
      }).unwrap();
      toast.success(res.message || "Loan application rejected.");
      setSelectedLoan(null);
      setActionModal(null);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Rejection failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Loan Portfolio Governance
              </h1>
              <Badge variant="primary">Executive Approval</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authorized admin sign-off for evaluated loan applications with automatic depository disbursement and schedule generation.
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
                { value: "ALL", label: "All Loan Files" },
                { value: LOAN_STATUS.UNDER_REVIEW, label: "Awaiting Admin Sign-off" },
                { value: LOAN_STATUS.PENDING, label: "Pending Underwriting" },
                { value: LOAN_STATUS.ACTIVE, label: "Active Loans" },
                { value: LOAN_STATUS.COMPLETED, label: "Completed Loans" },
                { value: LOAN_STATUS.REJECTED, label: "Rejected" },
              ]}
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading loan portfolio...
            </div>
          ) : loans.length === 0 ? (
            <EmptyState
              icon={<Landmark className="h-7 w-7 text-indigo-500" />}
              title="No loan files found"
              description="No applications matched the selected filter."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan Ref</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Target Account</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Forwarded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((l) => {
                  const applicant = l.userId as IUser;
                  const account = l.accountId as IBankAccount;
                  return (
                    <TableRow key={l._id}>
                      <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {l.loanNumber}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {applicant?.name || "Unknown"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {applicant?.email}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {account ? `Acc #${account.accountNumber}` : "N/A"}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(l.amount)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(l.remainingBalance)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            l.status === LOAN_STATUS.ACTIVE
                              ? "success"
                              : l.status === LOAN_STATUS.UNDER_REVIEW
                              ? "primary"
                              : l.status === LOAN_STATUS.PENDING
                              ? "warning"
                              : l.status === LOAN_STATUS.COMPLETED
                              ? "info"
                              : "danger"
                          }
                          size="sm"
                          dot
                        >
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {formatDate(l.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLoan(l)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {l.status !== LOAN_STATUS.ACTIVE &&
                            l.status !== LOAN_STATUS.COMPLETED &&
                            l.status !== LOAN_STATUS.REJECTED && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLoan(l);
                                    setActionModal("APPROVE");
                                  }}
                                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLoan(l);
                                    setActionModal("REJECT");
                                  }}
                                  leftIcon={<XCircle className="h-3.5 w-3.5" />}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                        </div>
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

        {/* Action Confirmation Modal */}
        <Modal
          isOpen={!!actionModal}
          onClose={() => setActionModal(null)}
          title={
            actionModal === "APPROVE"
              ? "Confirm Loan Approval & Disbursement"
              : "Reject Loan Application"
          }
          description={`Loan Ref: ${selectedLoan?.loanNumber || ""}`}
        >
          {actionModal === "APPROVE" ? (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="font-bold block">Automated Transaction Trigger:</span>
                Approving this credit application will atomically credit{" "}
                <span className="font-bold">{formatCurrency(selectedLoan?.amount || 0)}</span> directly into the customer&apos;s depository account and initialize the complete installment schedule.
              </div>
              <Input
                label="Executive Approval Note (Optional)"
                placeholder="e.g. Cleared by executive credit committee..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  isLoading={isApproving}
                  onClick={handleApprove}
                >
                  Authorize & Disburse Credit
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <Input
                label="Rejection Reason"
                placeholder="e.g. Insufficient verifiable income..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isRejecting}
                  onClick={handleReject}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
