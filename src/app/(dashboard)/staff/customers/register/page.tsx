"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, Phone, FileText, MapPin, DollarSign } from "lucide-react";
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
import { useRegisterCustomerByStaffMutation } from "@/redux/api/customersApi";
import { ROLES, ACCOUNT_TYPES, AccountType } from "@/lib/constants";

export default function StaffRegisterCustomerPage() {
  const router = useRouter();
  const [registerCustomerMutation, { isLoading }] =
    useRegisterCustomerByStaffMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "CustomerTemp123!",
    phone: "",
    nationalId: "",
    address: "",
    initialAccountType: ACCOUNT_TYPES.SAVINGS as AccountType,
    initialDeposit: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and email are mandatory.");
      return;
    }

    try {
      const res = await registerCustomerMutation(formData).unwrap();
      toast.success(res.message || "Customer onboarded successfully!");
      router.push("/staff/customers");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Registration failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Onboard New Customer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Register a verified customer profile and issue their initial depository account.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Identity & Depository Setup</CardTitle>
            <CardDescription>
              All customer profiles registered at the branch desk are automatically marked KYC verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Legal Name"
                placeholder="Marcus Brody"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="marcus@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />

              <Input
                label="Initial Password"
                type="password"
                leftIcon={<Lock className="h-4 w-4" />}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                helperText="Customer can change this upon first login"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 012-7744"
                  leftIcon={<Phone className="h-4 w-4" />}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <Input
                  label="National ID / SSN"
                  placeholder="SSN-660-44-9182"
                  leftIcon={<FileText className="h-4 w-4" />}
                  value={formData.nationalId}
                  onChange={(e) =>
                    setFormData({ ...formData, nationalId: e.target.value })
                  }
                />
              </div>

              <Input
                label="Residential Address"
                placeholder="128 Silicon Parkway, Austin, TX"
                leftIcon={<MapPin className="h-4 w-4" />}
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Primary Depository Account"
                  value={formData.initialAccountType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialAccountType: e.target.value as AccountType,
                    })
                  }
                  options={[
                    { value: ACCOUNT_TYPES.SAVINGS, label: "Savings Account" },
                    { value: ACCOUNT_TYPES.CURRENT, label: "Current Account" },
                    {
                      value: ACCOUNT_TYPES.BUSINESS,
                      label: "Business Account",
                    },
                  ]}
                />

                <Input
                  label="Opening Deposit ($)"
                  type="number"
                  leftIcon={<DollarSign className="h-4 w-4" />}
                  value={formData.initialDeposit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialDeposit: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="submit"
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={<UserPlus className="h-4 w-4" />}
                >
                  Create Profile & Issue Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
