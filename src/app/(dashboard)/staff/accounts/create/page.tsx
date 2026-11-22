"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, DollarSign } from "lucide-react";
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
import { useGetCustomersQuery } from "@/redux/api/customersApi";
import { useCreateAccountMutation } from "@/redux/api/accountsApi";
import { ROLES, ACCOUNT_TYPES, AccountType } from "@/lib/constants";

export default function StaffCreateAccountPage() {
  const router = useRouter();
  const { data: customersData, isLoading: isLoadingCustomers } =
    useGetCustomersQuery({ limit: 100 });
  const [createAccountMutation, { isLoading: isCreating }] =
    useCreateAccountMutation();

  const customers = customersData?.customers || [];

  const [selectedUserId, setSelectedUserId] = useState("");
  const [accountType, setAccountType] = useState<AccountType>(ACCOUNT_TYPES.SAVINGS);
  const [initialDeposit, setInitialDeposit] = useState<number | string>(100);
  const [dailyTransferLimit, setDailyTransferLimit] = useState<number | string>(10000);

  const userId = selectedUserId || customers[0]?._id || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Please select a customer.");
      return;
    }

    try {
      const res = await createAccountMutation({
        userId,
        accountType,
        initialDeposit: parseFloat(initialDeposit.toString()) || 0,
        dailyTransferLimit: parseFloat(dailyTransferLimit.toString()) || 10000,
      }).unwrap();

      toast.success(res.message || "Account issued successfully!");
      router.push("/staff/accounts");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Account creation failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Issue New Depository Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create an additional Savings, Current, or Business account for a registered customer.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Issuance Specifications</CardTitle>
            <CardDescription>
              A unique 10-digit account number will be generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Assign to Verified Customer"
                value={userId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                options={customers.map((c) => ({
                  value: c._id,
                  label: `${c.name} (${c.email})`,
                }))}
              />

              <Select
                label="Account Category"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                options={[
                  { value: ACCOUNT_TYPES.SAVINGS, label: "Savings Depository Vault" },
                  { value: ACCOUNT_TYPES.CURRENT, label: "Current Checking Account" },
                  { value: ACCOUNT_TYPES.BUSINESS, label: "Commercial Business Vault" },
                ]}
              />

              <Input
                label="Opening Deposit ($)"
                type="number"
                leftIcon={<DollarSign className="h-4 w-4" />}
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(e.target.value)}
                min={0}
                required
              />

              <Input
                label="Daily Transfer Ceiling ($)"
                type="number"
                leftIcon={<DollarSign className="h-4 w-4" />}
                value={dailyTransferLimit}
                onChange={(e) => setDailyTransferLimit(e.target.value)}
                min={100}
                required
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  isLoading={isCreating || isLoadingCustomers}
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                >
                  Generate & Issue Depository Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
