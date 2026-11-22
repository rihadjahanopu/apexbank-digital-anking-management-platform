"use client";

import React, { useState } from "react";
import { FileCheck, Send, XCircle, Eye } from "lucide-react";
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
  useReviewLoanMutation,
} from "@/redux/api/loansApi";
import { ROLES, LOAN_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { IUser, ILoan } from "@/types";

export default function StaffLoansPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState<ILoan | null>(null);
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"FORWARD_ADMIN" | "REJECT">("FORWARD_ADMIN");

  const { data, isLoading } = useGetLoansQuery({
    status: statusFilter,
    page,
    limit: 15,
  });

  const [reviewLoanMutation, { isLoading: isReviewing }] =
    useReviewLoanMutation();

  const loans = data?.loans || [];
  const totalPages = data?.totalPages || 1;

  const handleReviewLoan = async () => {
    if (!selectedLoan) return;
    try {
      const res = await reviewLoanMutation({
        id: selectedLoan._id,
        action,
        note,
      }).unwrap();
      toast.success(res.message || "Loan review completed.");
      setSelectedLoan(null);
      setNote("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Review action failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Loan Underwriting Desk
              </h1>
              <Badge variant="info">Credit Assessment</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review customer credit requests, assess income and employment stability, append officer notes, and forward for Admin approval.
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
                { value: LOAN_STATUS.PENDING, label: "Pending Underwriting" },
                { value: LOAN_STATUS.UNDER_REVIEW, label: "Forwarded to Admin" },
                { value: LOAN_STATUS.ACTIVE, label: "Active & Disbursed" },
                { value: LOAN_STATUS.COMPLETED, label: "Completed" },
                { value: LOAN_STATUS.REJECTED, label: "Rejected" },
              ]}
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading loan applications...
            </div>
          ) : loans.length === 0 ? (
            <EmptyState
              icon={<FileCheck className="h-7 w-7 text-indigo-500" />}
              title="No loan files found"
              description="No customer loan applications matched your filter."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan Ref</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Monthly Income</TableHead>
                  <TableHead>Monthly Repayment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((l) => {
                  const applicant = l.userId as IUser;
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
                      <TableCell>
                        <Badge variant="outline" size="sm">
                          {l.loanType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(l.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                        {formatCurrency(l.monthlyIncome)}/mo
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(l.monthlyRepayment)}/mo ({l.durationMonths}m)
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            l.status === LOAN_STATUS.ACTIVE
                              ? "success"
                              : l.status === LOAN_STATUS.PENDING
                              ? "warning"
                              : l.status === LOAN_STATUS.UNDER_REVIEW
                              ? "info"
                              : l.status === LOAN_STATUS.COMPLETED
                              ? "primary"
                              : "danger"
                          }
                          size="sm"
                          dot
                        >
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLoan(l)}
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Assess
                        </Button>
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

        {/* Loan Assessment Dossier Modal */}
        <Modal
          isOpen={!!selectedLoan}
          onClose={() => setSelectedLoan(null)}
          title={`Credit Dossier — Loan #${selectedLoan?.loanNumber || ""}`}
          description="Branch desk risk assessment & underwriting evaluation."
          maxWidth="lg"
        >
          {selectedLoan && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-slate-400 block">Requested Amount</span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(selectedLoan.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Duration & Rate</span>
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedLoan.durationMonths} Months @ {selectedLoan.interestRate}% APR
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Monthly Repayment</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(selectedLoan.monthlyRepayment)}/month
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Repayment</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(selectedLoan.totalRepayment)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Stated Monthly Income</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(selectedLoan.monthlyIncome)}/month
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Employment Standing</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedLoan.employmentStatus}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Stated Purpose</span>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300">
                    {selectedLoan.purpose}
                  </p>
                </div>
              </div>

              {selectedLoan.internalNotes && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
                  <span className="font-semibold text-slate-500 block mb-1">
                    Existing Internal Notes:
                  </span>
                  <p className="whitespace-pre-wrap font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {selectedLoan.internalNotes}
                  </p>
                </div>
              )}

              {selectedLoan.status === LOAN_STATUS.PENDING && (
                <div className="space-y-3 pt-2">
                  <Input
                    label="Add Officer Assessment Note"
                    placeholder="e.g. Verified 6 months of paystubs. Debt-to-income is healthy..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={isReviewing}
                      onClick={() => {
                        setAction("REJECT");
                        handleReviewLoan();
                      }}
                      leftIcon={<XCircle className="h-3.5 w-3.5" />}
                    >
                      Reject at Desk
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isReviewing}
                      onClick={() => {
                        setAction("FORWARD_ADMIN");
                        handleReviewLoan();
                      }}
                      leftIcon={<Send className="h-3.5 w-3.5" />}
                    >
                      Forward to Admin for Approval
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
