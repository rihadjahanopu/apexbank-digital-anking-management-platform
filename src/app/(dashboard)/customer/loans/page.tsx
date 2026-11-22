"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Landmark,
  Plus,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Modal,
  Select,
  EmptyState,
} from "@/components/ui";
import {
  useGetMyLoansQuery,
  useRepayLoanInstallmentMutation,
} from "@/redux/api/loansApi";
import { useGetMyAccountsQuery } from "@/redux/api/accountsApi";
import { formatCurrency } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ROLES, LOAN_STATUS, ACCOUNT_STATUS } from "@/lib/constants";
import { ILoan, ILoanRepayment } from "@/types";

export default function CustomerLoansPage() {
  const router = useRouter();
  const { data, isLoading } = useGetMyLoansQuery();
  const { data: accountsData } = useGetMyAccountsQuery();
  const [repayMutation, { isLoading: isRepaying }] =
    useRepayLoanInstallmentMutation();

  const loans = data?.loans || [];
  const activeAccounts = (accountsData?.accounts || []).filter(
    (a) => a.status === ACCOUNT_STATUS.ACTIVE
  );

  const [selectedLoan, setSelectedLoan] = useState<ILoan | null>(null);
  const [repayModalItem, setRepayModalItem] = useState<{
    loan: ILoan;
    installment: ILoanRepayment;
  } | null>(null);
  const [selectedRepayAccountId, setSelectedRepayAccountId] = useState("");
  const repayAccountId = selectedRepayAccountId || activeAccounts[0]?._id || "";

  const handleExecuteRepayment = async () => {
    if (!repayModalItem || !repayAccountId) return;
    try {
      const res = await repayMutation({
        loanId: repayModalItem.loan._id,
        installmentNumber: repayModalItem.installment.installmentNumber,
        accountId: repayAccountId,
      }).unwrap();
      toast.success(res.message || "Installment paid successfully!");
      setRepayModalItem(null);
      if (selectedLoan && selectedLoan._id === repayModalItem.loan._id) {
        setSelectedLoan((prev) =>
          prev
            ? {
                ...prev,
                remainingBalance: Math.max(
                  0,
                  prev.remainingBalance - repayModalItem.installment.amount
                ),
                repayments: prev.repayments.map((r) =>
                  r.installmentNumber ===
                  repayModalItem.installment.installmentNumber
                    ? { ...r, status: "PAID" as const }
                    : r
                ),
              }
            : null
        );
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Repayment failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Credit Facilities & Loans
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage personal and commercial loan portfolios, repayment schedules, and installment settlements.
            </p>
          </div>

          <Link href="/customer/loans/apply">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Apply for Loan
            </Button>
          </Link>
        </div>

        {/* Loan Cards */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading credit facilities...
          </div>
        ) : loans.length === 0 ? (
          <EmptyState
            icon={<Landmark className="h-7 w-7" />}
            title="No loan facilities active"
            description="You currently have no active credit lines or pending applications."
            actionLabel="Apply for Loan"
            onAction={() => router.push("/customer/loans/apply")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loans.map((loan) => (
              <Card
                key={loan._id}
                className="overflow-hidden border-slate-200/90 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                          <Landmark className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold">
                            {loan.loanType} Facility
                          </CardTitle>
                          <span className="font-mono text-[10px] text-slate-400">
                            Ref: {loan.loanNumber}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          loan.status === LOAN_STATUS.ACTIVE
                            ? "success"
                            : loan.status === LOAN_STATUS.PENDING
                            ? "warning"
                            : loan.status === LOAN_STATUS.UNDER_REVIEW
                            ? "info"
                            : loan.status === LOAN_STATUS.COMPLETED
                            ? "primary"
                            : "danger"
                        }
                        size="sm"
                        dot
                      >
                        {loan.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Principal Amount
                        </span>
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(loan.amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Remaining Balance
                        </span>
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(loan.remainingBalance)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Monthly Installment
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(loan.monthlyRepayment)}/mo
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">
                          Terms & APR
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {loan.durationMonths}m @ {loan.interestRate}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Applied: {formatDate(loan.createdAt)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLoan(loan)}
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                  >
                    Repayment Schedule ({loan.repayments?.length || 0})
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Repayment Schedule Modal */}
        <Modal
          isOpen={!!selectedLoan}
          onClose={() => setSelectedLoan(null)}
          title={`Repayment Schedule — ${selectedLoan?.loanNumber || ""}`}
          description={`Principal: ${formatCurrency(
            selectedLoan?.amount || 0
          )} • Remaining: ${formatCurrency(
            selectedLoan?.remainingBalance || 0
          )}`}
          maxWidth="lg"
        >
          {selectedLoan && (
            <div className="space-y-4 pt-2">
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inst. #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedLoan.repayments || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs py-6 text-slate-400">
                          Repayment schedule will be generated upon loan approval.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedLoan.repayments.map((item) => (
                        <TableRow key={item.installmentNumber}>
                          <TableCell className="font-semibold text-xs">
                            #{item.installmentNumber}
                          </TableCell>
                          <TableCell className="font-bold text-xs">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatDate(item.dueDate)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={item.status === "PAID" ? "success" : "warning"}
                              size="sm"
                              dot
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.status !== "PAID" &&
                            selectedLoan.status === LOAN_STATUS.ACTIVE ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() =>
                                  setRepayModalItem({
                                    loan: selectedLoan,
                                    installment: item,
                                  })
                                }
                              >
                                Pay Now
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                {item.status === "PAID" ? "Settled" : "Pending"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </Modal>

        {/* Pay Installment Modal */}
        <Modal
          isOpen={!!repayModalItem}
          onClose={() => setRepayModalItem(null)}
          title={`Pay Installment #${repayModalItem?.installment.installmentNumber || ""}`}
          description={`Amount due: ${formatCurrency(
            repayModalItem?.installment.amount || 0
          )}`}
        >
          <div className="space-y-4 pt-2">
            <Select
              label="Pay from Depository Account"
              value={repayAccountId}
              onChange={(e) => setSelectedRepayAccountId(e.target.value)}
              options={activeAccounts.map((a) => ({
                value: a._id,
                label: `${a.accountType} (${a.accountNumber}) — Available: ${formatCurrency(
                  a.availableBalance
                )}`,
              }))}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRepayModalItem(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={isRepaying}
                onClick={handleExecuteRepayment}
              >
                Confirm Payment of {formatCurrency(repayModalItem?.installment.amount || 0)}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
