"use client";

import React, { useState } from "react";
import { ShieldCheck, DollarSign, Percent, AlertTriangle } from "lucide-react";
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
  Badge,
} from "@/components/ui";
import { ROLES, DEFAULT_BANKING_SETTINGS } from "@/lib/constants";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "@/redux/api/settingsApi";

export default function AdminSettingsPage() {
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettingsMutation, { isLoading: isUpdating }] =
    useUpdateSettingsMutation();

  const [formOverrides, setFormOverrides] = useState<
    Partial<typeof DEFAULT_BANKING_SETTINGS>
  >({});

  const formData = {
    ...(data?.settings || DEFAULT_BANKING_SETTINGS),
    ...formOverrides,
  };

  const handleChange = (
    field: keyof typeof DEFAULT_BANKING_SETTINGS,
    val: number
  ) => {
    setFormOverrides((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateSettingsMutation(formData).unwrap();
      toast.success(res.message || "Banking settings updated successfully!");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to update settings.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Global Banking Governance & Settings
            </h1>
            <Badge variant="primary">Rule Engine</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define system limits, transfer fees, automated fraud thresholds, and credit interest parameters.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account & Transfer Limits */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Transfer & Account Limits</CardTitle>
                </div>
                <CardDescription>
                  Governs standard daily limits and minimum depository balance policies.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Default Daily Transfer Limit ($)"
                  type="number"
                  value={formData.dailyTransferLimit}
                  onChange={(e) =>
                    handleChange("dailyTransferLimit", parseFloat(e.target.value) || 0)
                  }
                  required
                />
                <Input
                  label="Maximum Single Transaction Cap ($)"
                  type="number"
                  value={formData.maximumTransactionAmount}
                  onChange={(e) =>
                    handleChange(
                      "maximumTransactionAmount",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
                <Input
                  label="Minimum Account Balance ($)"
                  type="number"
                  value={formData.minimumAccountBalance}
                  onChange={(e) =>
                    handleChange(
                      "minimumAccountBalance",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
              </CardContent>
            </Card>

            {/* Fees & Rates */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-emerald-600" />
                  <CardTitle>Fee & Interest Structures</CardTitle>
                </div>
                <CardDescription>
                  Configure transfer surcharge percentages and standard loan rates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Transfer Fee Percentage (%)"
                  type="number"
                  step="0.1"
                  value={formData.transferFeePercentage}
                  onChange={(e) =>
                    handleChange(
                      "transferFeePercentage",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
                <Input
                  label="Minimum Transfer Fee Floor ($)"
                  type="number"
                  step="0.5"
                  value={formData.minTransferFee}
                  onChange={(e) =>
                    handleChange("minTransferFee", parseFloat(e.target.value) || 0)
                  }
                  required
                />
                <Input
                  label="Default Base Loan Interest Rate (% APR)"
                  type="number"
                  step="0.1"
                  value={formData.loanInterestRateDefault}
                  onChange={(e) =>
                    handleChange(
                      "loanInterestRateDefault",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  required
                />
                <Input
                  label="Max Loan Duration (Months)"
                  type="number"
                  value={formData.maxLoanDurationMonths}
                  onChange={(e) =>
                    handleChange(
                      "maxLoanDurationMonths",
                      parseInt(e.target.value, 10) || 12
                    )
                  }
                  required
                />
              </CardContent>
            </Card>

            {/* Fraud & Security Watch Engine */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  <CardTitle>Automated Fraud Detection Thresholds</CardTitle>
                </div>
                <CardDescription>
                  Transactions matching or exceeding these triggers are automatically flagged for review.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Single Flagging Threshold ($)"
                  type="number"
                  value={formData.suspiciousTransactionThreshold}
                  onChange={(e) =>
                    handleChange(
                      "suspiciousTransactionThreshold",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  helperText="Any transfer ≥ this triggers an alert"
                  required
                />
                <Input
                  label="Rapid Velocity Window (Minutes)"
                  type="number"
                  value={formData.rapidTransactionWindowMinutes}
                  onChange={(e) =>
                    handleChange(
                      "rapidTransactionWindowMinutes",
                      parseInt(e.target.value, 10) || 1
                    )
                  }
                  helperText="Detection observation window"
                  required
                />
                <Input
                  label="Velocity Limit (Txns / Window)"
                  type="number"
                  value={formData.rapidTransactionCountLimit}
                  onChange={(e) =>
                    handleChange(
                      "rapidTransactionCountLimit",
                      parseInt(e.target.value, 10) || 2
                    )
                  }
                  helperText="Exceeding this count triggers alert"
                  required
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              size="lg"
              isLoading={isUpdating || isLoading}
              leftIcon={<ShieldCheck className="h-4 w-4" />}
            >
              Enforce & Save Banking Rules
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
