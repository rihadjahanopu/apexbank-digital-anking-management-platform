"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  KeyRound,
  Building,
} from "lucide-react";
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
  Modal,
} from "@/components/ui";
import { useGetMyAccountsQuery } from "@/redux/api/accountsApi";
import { useTransferFundsMutation } from "@/redux/api/transactionsApi";
import { useGetSettingsQuery } from "@/redux/api/settingsApi";
import { formatCurrency, safeAdd, safeSubtract } from "@/lib/money";
import { ROLES, ACCOUNT_STATUS } from "@/lib/constants";

export default function FundTransferPage() {
  const router = useRouter();
  const { data: accountsData, isLoading: isLoadingAccounts } =
    useGetMyAccountsQuery();
  const { data: settingsData } = useGetSettingsQuery();
  const [transferMutation, { isLoading: isTransferring }] =
    useTransferFundsMutation();

  const accounts = (accountsData?.accounts || []).filter(
    (a) => a.status === ACCOUNT_STATUS.ACTIVE
  );

  const [selectedSenderId, setSelectedSenderId] = useState("");
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const senderAccountId = selectedSenderId || accounts[0]?._id || "";

  const selectedAccount = accounts.find((a) => a._id === senderAccountId);

  // Calculate fee: 0.5% with min $1.00
  const numericAmount = parseFloat(amount.toString()) || 0;
  const feePercentage = settingsData?.settings?.transferFeePercentage || 0.5;
  const minFee = settingsData?.settings?.minTransferFee || 1.0;
  const computedFee =
    numericAmount > 0
      ? Math.max(minFee, (numericAmount * feePercentage) / 100)
      : 0;
  const totalDeduction = safeAdd(numericAmount, computedFee);

  const maxAllowed = selectedAccount
    ? Math.max(
        0,
        safeSubtract(
          selectedAccount.availableBalance,
          selectedAccount.minimumBalance || 0
        )
      )
    : 0;

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderAccountId) {
      toast.error("Please select a source account.");
      return;
    }
    if (!recipientAccountNumber.trim()) {
      toast.error("Please specify a recipient account number.");
      return;
    }
    if (numericAmount <= 0) {
      toast.error("Please enter a valid transfer amount.");
      return;
    }
    if (totalDeduction > maxAllowed) {
      toast.error(
        `Insufficient available funds. Required: ${formatCurrency(
          totalDeduction
        )} (includes fee & reserve).`
      );
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleExecuteTransfer = async () => {
    if (!pin || pin.length !== 4) {
      toast.error("Please enter your 4-digit transaction PIN.");
      return;
    }

    try {
      const res = await transferMutation({
        senderAccountId,
        recipientAccountNumber: recipientAccountNumber.trim(),
        amount: numericAmount,
        description: description || "Intra-bank fund transfer",
        transactionPin: pin,
      }).unwrap();

      toast.success(res.message || "Transfer completed successfully!");
      setIsConfirmOpen(false);
      setAmount("");
      setDescription("");
      setPin("");
      router.push("/customer/transactions");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Transfer failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Send Money
            </h1>
            <Badge variant="primary" dot>
              Atomic Clearing
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Execute immediate intra-bank fund transfers with dual-account balance settlement.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transfer Specification</CardTitle>
            <CardDescription>
              Select your source depository vault and recipient credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOpenConfirm} className="space-y-4">
              {/* Sender Account */}
              <div>
                <Select
                  label="From Account"
                  value={senderAccountId}
                  onChange={(e) => setSelectedSenderId(e.target.value)}
                  options={accounts.map((a) => ({
                    value: a._id,
                    label: `${a.accountType} (${a.accountNumber}) — Avail: ${formatCurrency(
                      a.availableBalance
                    )}`,
                  }))}
                />
                {selectedAccount && (
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Daily Limit Remaining: {formatCurrency(selectedAccount.dailyTransferLimit)}
                    </span>
                    <span>
                      Minimum Reserve: {formatCurrency(selectedAccount.minimumBalance)}
                    </span>
                  </div>
                )}
              </div>

              {/* Recipient Account Number */}
              <Input
                label="Recipient 10-Digit Account Number"
                placeholder="e.g. 1003009911"
                leftIcon={<Building className="h-4 w-4" />}
                value={recipientAccountNumber}
                onChange={(e) => setRecipientAccountNumber(e.target.value)}
                required
              />

              {/* Amount */}
              <div>
                <Input
                  label="Amount to Transfer ($)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {selectedAccount && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Max available for transfer:{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(maxAllowed)}
                    </span>
                  </p>
                )}
              </div>

              {/* Description */}
              <Input
                label="Transfer Reference / Description"
                placeholder="e.g. Invoice payment, rent, dinner..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Summary Fee Box */}
              {numericAmount > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Transfer Amount</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(numericAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Estimated Fee ({feePercentage}%, min {formatCurrency(minFee)})</span>
                    <span>{formatCurrency(computedFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-indigo-600 dark:text-indigo-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Account Deduction</span>
                    <span>{formatCurrency(totalDeduction)}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                disabled={isLoadingAccounts || accounts.length === 0}
                leftIcon={<ArrowLeftRight className="h-4 w-4" />}
              >
                Review & Authorize Transfer
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Confirmation & PIN Authorization Modal */}
        <Modal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          title="Authorize Intra-Bank Transfer"
          description="Enter your 4-digit cryptographic transaction PIN to authorize this transfer."
        >
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-indigo-50/80 p-4 dark:bg-indigo-950/40 text-xs space-y-1.5 text-indigo-950 dark:text-indigo-200">
              <div className="flex justify-between">
                <span>Beneficiary Account:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  #{recipientAccountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Principal Amount:</span>
                <span className="font-bold">{formatCurrency(numericAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Fee:</span>
                <span>{formatCurrency(computedFee)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-indigo-200 dark:border-indigo-800">
                <span>Total Deducted:</span>
                <span>{formatCurrency(totalDeduction)}</span>
              </div>
            </div>

            <Input
              label="4-Digit Authorization PIN"
              type="password"
              maxLength={4}
              placeholder="••••"
              leftIcon={<KeyRound className="h-4 w-4" />}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              helperText="Default demo account PIN is 1234"
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={isTransferring}
                onClick={handleExecuteTransfer}
              >
                Authorize & Send Funds
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
