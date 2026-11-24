"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Landmark,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  FileText,
  MapPin,
  ArrowRight,
  ScanLine,
} from "lucide-react";
import { toast } from "sonner";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { useRegisterMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/authSlice";
import { Input } from "@/components/ui";
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

      if (response.user.role === ROLES.ADMIN) {
        toast.success(response.message || "Admin account created successfully!");
        router.push("/admin/dashboard");
      } else {
        toast.success("Registration successful! Complete your bank account application and initial deposit.");
        router.push("/customer/accounts/open");
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020b08] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-600/15 rounded-full blur-[140px] animate-pulse-emerald" />
        <div className="absolute bottom-[5%] -right-[10%] w-[500px] h-[500px] bg-teal-800/10 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(52, 211, 153, 0.8) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-bold text-2xl tracking-tight text-white group"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 border border-emerald-300/30 group-hover:scale-105 transition-transform">
              <Landmark className="h-6 w-6 text-slate-950" />
            </div>
            <span>
              Apex<span className="text-emerald-400">Bank</span>
            </span>
            <span className="rounded-full bg-emerald-950 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-semibold text-emerald-300 uppercase tracking-wider">
              Reserve
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Open Digital Bank Account
          </h2>
          <p className="text-xs text-slate-400">
            Set up your verified credentials to access 5.40% APY vaults and international settlement.
          </p>
        </div>

        {/* Feature Pill */}
        <div className="flex items-center justify-center gap-2 rounded-2xl glass-forest-pill p-3 text-xs text-emerald-300 border border-emerald-500/20">
          <ScanLine className="h-4 w-4 text-emerald-400" />
          <span>Instant OCR Smart Scan & Biometric Identity Verification</span>
        </div>

        {/* Registration Glass Card */}
        <div className="glass-forest-card rounded-3xl p-6 sm:p-8 border border-emerald-500/25 shadow-2xl backdrop-blur-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Legal Name"
              placeholder="Jane Doe"
              leftIcon={<UserIcon className="h-4 w-4 text-emerald-400" />}
              error={errors.name?.message}
              {...register("name")}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="jane.doe@example.com"
              leftIcon={<Mail className="h-4 w-4 text-emerald-400" />}
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Master Password"
              type="password"
              placeholder="Min 8 chars with 1 number & 1 special"
              leftIcon={<Lock className="h-4 w-4 text-emerald-400" />}
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                placeholder="+1 (555) 012-3456"
                leftIcon={<Phone className="h-4 w-4 text-emerald-400" />}
                error={errors.phone?.message}
                {...register("phone")}
              />

              <Input
                label="National ID / SSN"
                placeholder="NID-XXXX-XXXX"
                leftIcon={<FileText className="h-4 w-4 text-emerald-400" />}
                error={errors.nationalId?.message}
                {...register("nationalId")}
              />
            </div>

            <Input
              label="Residential Address"
              placeholder="123 Financial Blvd, Suite 400"
              leftIcon={<MapPin className="h-4 w-4 text-emerald-400" />}
              error={errors.address?.message}
              {...register("address")}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-4 rounded-xl bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <span>{isLoading ? "Provisioning Client..." : "Create Account & Proceed to Onboarding"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Footer Redirect & Trust Badges */}
        <div className="space-y-4 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
            >
              Client Sign In
            </Link>
          </p>

          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 font-mono">
            <span>✓ Member FDIC</span>
            <span>✓ 256-Bit SSL</span>
            <span>✓ Zero Paperwork</span>
          </div>
        </div>
      </div>
    </div>
  );
}
