"use client";

import React, { useState } from "react";
import { ArrowDownToLine } from "lucide-react";
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
  useRequestDepositMutation,
  useGetDepositRequestsQuery,
} from "@/redux/api/transactionsApi";
import { formatCurrency } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { ROLES, ACCOUNT_STATUS, REQUEST_STATUS } from "@/lib/constants";
import { IBankAccount } from "@/types";

export default function CustomerDepositPage() {
  const { data: accountsData } = useGetMyAccountsQuery();
  const { data: requestsData } = useGetDepositRequestsQuery({});
  const [requestDepositMutation, { isLoading }] = useRequestDepositMutation();

  const accounts = (accountsData?.accounts || []).filter(
    (a) => a.status === ACCOUNT_STATUS.ACTIVE
  );

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("Online Deposit Check Clearance");

  const accountId = selectedAccountId || accounts[0]?._id || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!accountId) {
      toast.error("Please select a target account.");
      return;
    }
    if (isNaN(numericAmount) || numericAmount < 1) {
      toast.error("Minimum deposit request is $1.00.");
      return;
    }

    try {
      const res = await requestDepositMutation({
        accountId,
        amount: numericAmount,
        description,
      }).unwrap();
      toast.success(res.message || "Deposit request submitted.");
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
            Submit Depository Request
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Initiate incoming check clearance or branch deposit requests for credit into your depository vaults.
          </p>
        </div>

        {/* Deposit Request Form */}
        <Card>
          <CardHeader>
            <CardTitle>Deposit Order Form</CardTitle>
            <CardDescription>
              Your submission will be reviewed and cleared by a branch operations officer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Target Depository Account"
                value={accountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                options={accounts.map((a) => ({
                  value: a._id,
                  label: `${a.accountType} (${a.accountNumber}) — Balance: ${formatCurrency(
                    a.balance
                  )}`,
                }))}
              />

              <Input
                label="Deposit Amount ($)"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              <Input
                label="Check Number / Depository Reference"
                placeholder="e.g. Check #99018, ACH direct deposit memo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                leftIcon={<ArrowDownToLine className="h-4 w-4" />}
                className="w-full mt-2"
              >
                Submit Deposit for Branch Clearance
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Previous Requests Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>My Deposit History</CardTitle>
            <CardDescription>
              Real-time approval status of your submitted deposit requests.
            </CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Account</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(requestsData?.requests || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-xs py-8 text-slate-400">
                    No deposit requests submitted yet.
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
                      <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(req.amount)}
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
