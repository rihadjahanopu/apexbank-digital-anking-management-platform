"use client";

import React, { useState } from "react";
import { ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { useGetMyAccountsQuery } from "@/redux/api/accountsApi";
import {
  useRequestWithdrawalMutation,
  useGetWithdrawalRequestsQuery,
} from "@/redux/api/transactionsApi";
import { formatCurrency, safeSubtract } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { ROLES, ACCOUNT_STATUS, REQUEST_STATUS } from "@/lib/constants";
import { IBankAccount } from "@/types";

export default function CustomerWithdrawPage() {
  const { data: accountsData } = useGetMyAccountsQuery();
  const { data: requestsData } = useGetWithdrawalRequestsQuery({});
  const [requestWithdrawalMutation, { isLoading }] =
    useRequestWithdrawalMutation();

  const accounts = (accountsData?.accounts || []).filter(
    (a) => a.status === ACCOUNT_STATUS.ACTIVE
  );

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("Branch Counter Cash Withdrawal");

  const accountId = selectedAccountId || accounts[0]?._id || "";

  const selectedAccount = accounts.find((a) => a._id === accountId);
  const maxAvailable = selectedAccount
    ? Math.max(
        0,
        safeSubtract(
          selectedAccount.availableBalance,
          selectedAccount.minimumBalance || 0
        )
      )
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!accountId) {
      toast.error("Please select a source account.");
      return;
    }
    if (isNaN(numericAmount) || numericAmount < 1) {
      toast.error("Minimum withdrawal request is $1.00.");
      return;
    }
    if (numericAmount > maxAvailable) {
      toast.error(
        `Insufficient available funds. Maximum available: ${formatCurrency(
          maxAvailable
        )}.`
      );
      return;
    }

    try {
      const res = await requestWithdrawalMutation({
        accountId,
        amount: numericAmount,
        description,
      }).unwrap();
      toast.success(res.message || "Withdrawal request submitted.");
      setAmount("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Submission failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Submit Cash Withdrawal Request
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Request an authorized branch cash disbursement from your available account balances.
          </p>
        </div>

        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Order Form</CardTitle>
            <CardDescription>
              Withdrawals require branch officer approval and adequate depository reserve standing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Source Depository Account"
                value={accountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                options={accounts.map((a) => ({
                  value: a._id,
                  label: `${a.accountType} (${a.accountNumber}) — Available: ${formatCurrency(
                    a.availableBalance
                  )}`,
                }))}
              />

              <div>
                <Input
                  label="Withdrawal Amount ($)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Maximum available withdrawal:{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(maxAvailable)}
                  </span>
                </p>
              </div>

              <Input
                label="Withdrawal Purpose / Notes"
                placeholder="e.g. In-branch counter pickup, cash disbursement..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                leftIcon={<ArrowUpFromLine className="h-4 w-4" />}
                className="w-full mt-2"
              >
                Submit Withdrawal for Branch Authorization
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal History Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>My Withdrawal Requests</CardTitle>
            <CardDescription>
              Status tracking for all submitted withdrawal authorizations.
            </CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Account</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(requestsData?.requests || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs py-8 text-slate-400">
                    No withdrawal requests submitted yet.
                  </TableCell>
                </TableRow>
              ) : (
                (requestsData?.requests || []).map((req) => {
                  const account = req.accountId as IBankAccount;
                  return (
                    <TableRow key={req._id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {account ? `Acc #${account.accountNumber}` : "N/A"}
                      </TableCell>
                      <TableCell className="font-bold text-rose-600 dark:text-rose-400">
                        -{formatCurrency(req.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                        {req.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            req.status === REQUEST_STATUS.APPROVED
                              ? "success"
                              : req.status === REQUEST_STATUS.PENDING
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                          dot
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500 font-mono">
                        {formatDateTime(req.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
