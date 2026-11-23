"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Copy,
  Check,
  XCircle,
  AlertTriangle,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Modal,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import {
  useGetMyAccountsQuery,
  useGetMyClosureRequestsQuery,
  useRequestAccountClosureMutation,
} from "@/redux/api/accountsApi";
import { formatCurrency } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ROLES, ACCOUNT_STATUS, REQUEST_STATUS } from "@/lib/constants";
import { IBankAccount } from "@/types";

export default function CustomerAccountsPage() {
  const { data, isLoading } = useGetMyAccountsQuery();
  const accounts = data?.accounts || [];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: closuresData } = useGetMyClosureRequestsQuery();
  const [requestClosureMutation, { isLoading: isSubmittingClosure }] =
    useRequestAccountClosureMutation();
  const closureRequests = closuresData?.data || [];

  // Account Closure Modal State
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [selectedAccForClosure, setSelectedAccForClosure] =
    useState<IBankAccount | null>(null);
  const [closureReason, setClosureReason] = useState("");
  const [targetPayoutAccount, setTargetPayoutAccount] = useState("");

  const handleCopy = (accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedId(accNum);
    toast.success(`Account #${accNum} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClosureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccForClosure) return;

    if (!closureReason.trim()) {
      toast.error("Please state a reason for requesting account closure.");
      return;
    }

    try {
      const res = await requestClosureMutation({
        accountId: selectedAccForClosure._id,
        reason: closureReason.trim(),
        targetPayoutAccount: targetPayoutAccount.trim() || undefined,
      }).unwrap();

      toast.success(res.message);
      setIsClosureModalOpen(false);
      setSelectedAccForClosure(null);
      setClosureReason("");
      setTargetPayoutAccount("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to submit account closure request.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              My Depository Accounts
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your personal and commercial depository accounts, daily limits, and account credentials.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/customer/accounts/open">
              <Button
                size="sm"
                variant="primary"
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                leftIcon={<PlusCircle className="h-4 w-4" />}
              >
                Open New Account
              </Button>
            </Link>
            <Link href="/customer/transfer">
              <Button size="sm" variant="outline" leftIcon={<ArrowLeftRight className="h-4 w-4" />}>
                Transfer Funds
              </Button>
            </Link>
          </div>
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full p-12 text-center text-xs text-slate-400">
              Loading accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-slate-400">
              No depository accounts found.
            </div>
          ) : (
            accounts.map((acc) => (
              <Card
                key={acc._id}
                className="overflow-hidden border-slate-200/90 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                          <Building className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">
                            {acc.accountType} Account
                          </CardTitle>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {acc.currency}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          acc.status === ACCOUNT_STATUS.ACTIVE
                            ? "success"
                            : acc.status === ACCOUNT_STATUS.CLOSED
                            ? "danger"
                            : "warning"
                        }
                        size="sm"
                        dot
                      >
                        {acc.status === ACCOUNT_STATUS.PENDING
                          ? "Pending Staff Review"
                          : acc.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    {/* Account Number Box */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 px-3 dark:bg-slate-800/60">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">
                          Account Number
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                          {acc.accountNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(acc.accountNumber)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Copy account number"
                      >
                        {copiedId === acc.accountNumber ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Balance */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Total Depository Balance
                      </span>
                      <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                        {formatCurrency(acc.balance)}
                      </div>
                    </div>

                    {/* Details breakdown */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Available</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(acc.availableBalance)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Reserve Floor</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(acc.minimumBalance)}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1">
                        <span className="text-slate-400 block">
                          Daily Transfer Ceiling
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(acc.dailyTransferLimit)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Link href="/customer/deposit" className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={acc.status !== ACCOUNT_STATUS.ACTIVE}
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5 mr-1" />
                      Deposit
                    </Button>
                  </Link>
                  <Link href="/customer/withdraw" className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={acc.status !== ACCOUNT_STATUS.ACTIVE}
                    >
                      <ArrowUpFromLine className="h-3.5 w-3.5 mr-1" />
                      Withdraw
                    </Button>
                  </Link>
                  {acc.status === ACCOUNT_STATUS.ACTIVE && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => {
                        setSelectedAccForClosure(acc);
                        setClosureReason("");
                        setTargetPayoutAccount("");
                        setIsClosureModalOpen(true);
                      }}
                      title="Request Account Closure"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Account Closure Requests Tracker */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Account Closure Requests History
            </h2>
            <Badge variant="warning">Audit Managed</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Records of depository account termination requests and their administrative review status.
          </p>

          <Card>
            <CardContent className="p-0">
              {closureRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No account closure requests submitted.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recorded Balance</TableHead>
                      <TableHead>Payout Target</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Officer Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closureRequests.map((req) => {
                      const account = req.accountId as IBankAccount;
                      return (
                        <TableRow key={req._id}>
                          <TableCell className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            {account?.accountNumber || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {account?.accountType}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            {formatCurrency(req.balance)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-300">
                            {req.targetPayoutAccount || "Zero Balance / Cash"}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={req.reason}>
                            {req.reason}
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
                          <TableCell className="text-xs text-slate-500">
                            {req.adminRemarks || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal: Request Account Closure */}
        <Modal
          isOpen={isClosureModalOpen}
          onClose={() => setIsClosureModalOpen(false)}
          title="Request Depository Account Closure"
          description="Submit a verified closure application. A bank officer will review and finalize the settlement."
        >
          {selectedAccForClosure && (
            <form onSubmit={handleClosureSubmit} className="space-y-4 pt-2">
              <div className="rounded-xl border border-rose-200 dark:border-rose-950 p-3.5 space-y-2 bg-rose-50/50 dark:bg-rose-950/20 text-xs">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Important Account Termination Notice</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {selectedAccForClosure.accountNumber} ({selectedAccForClosure.accountType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(selectedAccForClosure.balance)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-rose-200 dark:border-rose-900">
                  Upon closure approval, this account will be sealed and all associated virtual/debit cards will be permanently blocked.
                </p>
              </div>

              {selectedAccForClosure.balance > 0 && (
                <Input
                  label="Target Account Number for Remaining Balance Transfer (Optional)"
                  placeholder="e.g. 1000100012 or External IBAN"
                  value={targetPayoutAccount}
                  onChange={(e) => setTargetPayoutAccount(e.target.value)}
                  helperText="Leave empty if you intend to withdraw cash or transfer funds beforehand."
                />
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Account Closure
                </label>
                <div className="space-y-1.5 mb-2">
                  {[
                    "Switching primary bank / Relocating",
                    "No longer require this depository account",
                    "Dissolving commercial or business entity",
                    "High fee structure / Unneeded reserve",
                  ].map((quickReason) => (
                    <button
                      key={quickReason}
                      type="button"
                      onClick={() => setClosureReason(quickReason)}
                      className={`w-full text-left p-2 rounded-lg text-xs border transition-all ${
                        closureReason === quickReason
                          ? "bg-rose-500/10 border-rose-500 text-rose-500 font-semibold"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {quickReason}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="Or provide custom reason..."
                  required
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsClosureModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  type="submit"
                  isLoading={isSubmittingClosure}
                >
                  Submit Closure Request
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
