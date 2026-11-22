"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  FileText,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { useRegisterMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/authSlice";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { ROLES } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [registerMutation, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      nationalId: "",
      address: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const response = await registerMutation(data).unwrap();
      dispatch(
        setCredentials({ user: response.user, token: response.token })
      );
      toast.success(response.message || "Account created successfully!");

      if (response.user.role === ROLES.ADMIN) {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-bold text-2xl tracking-tight text-slate-900 dark:text-white"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Building2 className="h-6 w-6" />
            </div>
            <span>
              Apex<span className="text-indigo-600 dark:text-indigo-400">Bank</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Open a Digital Banking Account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Instantly establish your verified digital profile and primary savings account.
          </p>
        </div>

        {/* Security / System Notice */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-300">
            <span className="font-bold">Automated Governance Protocol:</span> The first
            account created on a fresh database is provisioned with System Administrator clearance. Subsequent users receive Customer self-service accounts with automatic savings provisioning.
          </div>
        </div>

        {/* Registration Card */}
        <Card className="shadow-lg border-slate-200/90 dark:border-slate-800">
          <CardContent className="p-6 pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Legal Name"
                placeholder="Jane Doe"
                leftIcon={<UserIcon className="h-4 w-4" />}
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="jane.doe@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label="Master Password"
                type="password"
                placeholder="Minimum 8 characters with 1 number & 1 special"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register("password")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 012-3456"
                  leftIcon={<Phone className="h-4 w-4" />}
                  error={errors.phone?.message}
                  {...register("phone")}
                />

                <Input
                  label="National ID / SSN"
                  placeholder="SSN-XXX-XX-XXXX"
                  leftIcon={<FileText className="h-4 w-4" />}
                  error={errors.nationalId?.message}
                  {...register("nationalId")}
                />
              </div>

              <Input
                label="Residential Address"
                placeholder="123 Banking Blvd, City, Country"
                leftIcon={<MapPin className="h-4 w-4" />}
                error={errors.address?.message}
                {...register("address")}
              />

              <Button
                type="submit"
                className="w-full mt-4"
                size="lg"
                isLoading={isLoading}
              >
                Create Account & Initialize
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
