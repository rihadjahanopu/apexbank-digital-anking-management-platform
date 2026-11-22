"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, ArrowLeft, DollarSign, Calculator } from "lucide-react";
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
} from "@/components/ui";
import { useApplyLoanMutation } from "@/redux/api/loansApi";
import { useGetMyAccountsQuery } from "@/redux/api/accountsApi";
import { useGetSettingsQuery } from "@/redux/api/settingsApi";
import { formatCurrency } from "@/lib/money";
import { ROLES, LOAN_TYPES, ACCOUNT_STATUS, LoanType } from "@/lib/constants";

export default function CustomerApplyLoanPage() {
  const router = useRouter();
  const { data: accountsData } = useGetMyAccountsQuery();
  const { data: settingsData } = useGetSettingsQuery();
  const [applyLoanMutation, { isLoading }] = useApplyLoanMutation();

  const accounts = (accountsData?.accounts || []).filter(
    (a) => a.status === ACCOUNT_STATUS.ACTIVE
  );

  const defaultInterestRate =
    settingsData?.settings?.loanInterestRateDefault || 7.5;

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [loanType, setLoanType] = useState<LoanType>(LOAN_TYPES.PERSONAL);
  const [amount, setAmount] = useState<number | string>(5000);
  const [durationMonths, setDurationMonths] = useState<number | string>(12);
  const [monthlyIncome, setMonthlyIncome] = useState<number | string>(5000);
  const [employmentStatus, setEmploymentStatus] = useState("Full-Time Employed");
  const [purpose, setPurpose] = useState("Personal expenditures & investment");

  const accountId = selectedAccountId || accounts[0]?._id || "";

  // Live Amortization Calculator
  const principal = parseFloat(amount.toString()) || 0;
  const duration = parseInt(durationMonths.toString(), 10) || 12;
  const monthlyRate = defaultInterestRate / 100 / 12;

  const monthlyRepayment =
    principal > 0 && duration > 0
      ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, duration))) /
        (Math.pow(1 + monthlyRate, duration) - 1)
      : 0;

  const totalRepayment = monthlyRepayment * duration;
  const totalInterest = Math.max(0, totalRepayment - principal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      toast.error("Please select a depository account for disbursement.");
      return;
    }
    if (principal < 100) {
      toast.error("Minimum loan amount is $100.");
      return;
    }
    if (parseFloat(monthlyIncome.toString()) <= 0) {
      toast.error("Please enter a valid monthly income.");
      return;
    }

    try {
      const res = await applyLoanMutation({
        accountId,
        loanType,
        amount: principal,
        durationMonths: duration,
        monthlyIncome: parseFloat(monthlyIncome.toString()),
        employmentStatus,
        purpose,
      }).unwrap();

      toast.success(res.message || "Loan application submitted!");
      router.push("/customer/loans");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Application submission failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/customer/loans")}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Apply for Credit Facility
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transparent credit rates, instant amortization calculations, and rapid branch underwriting.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Fields */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Credit Specifications</CardTitle>
                <CardDescription>
                  Specify your desired borrowing amount, terms, and income verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Disbursement Depository Account"
                  value={accountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  options={accounts.map((a) => ({
                    value: a._id,
                    label: `${a.accountType} (${a.accountNumber})`,
                  }))}
                />

                <Select
                  label="Loan Product Type"
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value as LoanType)}
                  options={[
                    { value: LOAN_TYPES.PERSONAL, label: "Personal Loan" },
                    { value: LOAN_TYPES.HOME, label: "Home Mortgage Loan" },
                    { value: LOAN_TYPES.BUSINESS, label: "Business Commercial Credit" },
                    { value: LOAN_TYPES.EDUCATION, label: "Education Loan" },
                    { value: LOAN_TYPES.VEHICLE, label: "Vehicle Auto Loan" },
                  ]}
                />

                <Input
                  label="Requested Principal Amount ($)"
                  type="number"
                  leftIcon={<DollarSign className="h-4 w-4" />}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={100}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Duration: {duration} Months ({Math.round(duration / 12 * 10) / 10} Years)
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    step="3"
                    value={duration}
                    onChange={(e) => setDurationMonths(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>3 months</span>
                    <span>24 months</span>
                    <span>60 months</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Monthly Net Income ($)"
                    type="number"
                    leftIcon={<DollarSign className="h-4 w-4" />}
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    required
                  />

                  <Select
                    label="Employment Status"
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value)}
                    options={[
                      { value: "Full-Time Employed", label: "Full-Time Employed" },
                      { value: "Self-Employed / Business", label: "Self-Employed / Business" },
                      { value: "Part-Time Employed", label: "Part-Time Employed" },
                      { value: "Contractor", label: "Contractor" },
                    ]}
                  />
                </div>

                <Input
                  label="Loan Purpose & Allocation"
                  placeholder="e.g. Home improvements, inventory expansion..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
              </CardContent>
            </Card>

            {/* Live Calculation Preview Card */}
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 border-indigo-200 dark:border-indigo-900/60">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 mb-4">
                  <Calculator className="h-5 w-5" />
                  <h4 className="text-sm font-bold uppercase tracking-wider">
                    Amortization Estimate
                  </h4>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                      Estimated Monthly Installment
                    </span>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(monthlyRepayment)}/mo
                    </div>
                  </div>

                  <div className="pt-3 border-t border-indigo-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Standard APR</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {defaultInterestRate}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Total Estimated Interest</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(totalInterest)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-indigo-100 dark:border-slate-800">
                      <span>Total Repayment</span>
                      <span>{formatCurrency(totalRepayment)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-6 shadow-md shadow-indigo-500/20"
                  isLoading={isLoading}
                  leftIcon={<Landmark className="h-4 w-4" />}
                >
                  Submit Credit Application
                </Button>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
