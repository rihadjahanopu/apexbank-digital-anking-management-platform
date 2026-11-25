"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Landmark,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  Users,
  KeyRound,
  Fingerprint,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { useLoginMutation } from "@/redux/api/authApi";
import { useLogin2faMutation } from "@/redux/api/twoFactorApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/authSlice";
import { Input } from "@/components/ui";
import { ROLES } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loginMutation, { isLoading }] = useLoginMutation();
  const [login2faMutation, { isLoading: isVerifying2fa }] = useLogin2faMutation();
  const [autoSeeding, setAutoSeeding] = useState(false);
  const [requireTwoFactor, setRequireTwoFactor] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const response = await loginMutation(data).unwrap();

      const resp2fa = response as unknown as { requireTwoFactor?: boolean; tempToken?: string };
      if (resp2fa.requireTwoFactor && resp2fa.tempToken) {
        setRequireTwoFactor(true);
        setTempToken(resp2fa.tempToken);
        toast.info("Two-factor authentication required. Please enter your 6-digit TOTP code.");
        return;
      }

      dispatch(
        setCredentials({ user: response.user, token: response.token })
      );
      toast.success(response.message || "Logged in successfully!");

      if (response.user.role === ROLES.ADMIN) {
        router.push("/admin/dashboard");
      } else if (response.user.role === ROLES.STAFF) {
        router.push("/staff/dashboard");
      } else {
        if (response.user.hasAccount === false) {
          toast.info("Please complete your account opening application to activate your banking dashboard.");
          router.push("/customer/accounts/open");
        } else {
          router.push("/customer/dashboard");
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Login failed. Please check your credentials.");
    }
  };

  const on2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    try {
      const response = await login2faMutation({
        tempToken,
        token: totpCode.trim(),
      }).unwrap();

      dispatch(
        setCredentials({ user: response.user, token: response.token })
      );
      toast.success(response.message || "2FA verification successful!");

      if (response.user.role === ROLES.ADMIN) {
        router.push("/admin/dashboard");
      } else if (response.user.role === ROLES.STAFF) {
        router.push("/staff/dashboard");
      } else {
        if (response.user.hasAccount === false) {
          toast.info("Please complete your account opening application to activate your banking dashboard.");
          router.push("/customer/accounts/open");
        } else {
          router.push("/customer/dashboard");
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Invalid 2FA code. Please try again.");
    }
  };

  const fillDemoCredentials = (role: "admin" | "staff" | "customer") => {
    if (role === "admin") {
      setValue("email", "admin@apexbank.com");
      setValue("password", "AdminPassword123!");
    } else if (role === "staff") {
      setValue("email", "staff@apexbank.com");
      setValue("password", "StaffPassword123!");
    } else {
      setValue("email", "customer@apexbank.com");
      setValue("password", "CustomerPassword123!");
    }
  };

  const handleSeedDatabase = async () => {
    setAutoSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Database seeded with demo accounts! You can now log in.");
        fillDemoCredentials("admin");
      } else {
        toast.error(data.error || "Seeding failed");
      }
    } catch {
      toast.error("Network error while seeding database");
    } finally {
      setAutoSeeding(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setIsPasskeyLoading(true);
    try {
      const { browserSupportsWebAuthn, startAuthentication } = await import(
        "@simplewebauthn/browser"
      );
      if (!browserSupportsWebAuthn()) {
        toast.error(
          "Passkey sign-in is not supported in this browser or over an insecure connection (HTTPS or localhost is required)."
        );
        return;
      }

      const optRes = await fetch("/api/auth/passkey/login-options", {
        method: "POST",
        credentials: "include",
      });
      const optData = await optRes.json();
      if (!optData.success) {
        toast.error(optData.error || "Failed to initiate passkey sign-in.");
        return;
      }

      const credential = await startAuthentication({
        optionsJSON: optData.options,
      });

      const verifyRes = await fetch("/api/auth/passkey/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          credential,
          expectedChallenge: optData.options?.challenge,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        if (
          verifyRes.status === 404 &&
          typeof window !== "undefined" &&
          "PublicKeyCredential" in window &&
          "signalUnknownCredential" in window.PublicKeyCredential
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (window.PublicKeyCredential as any).signalUnknownCredential({
            rpId: optData.options.rpId,
            credentialId: credential.id,
          });
        }
        toast.error(verifyData.error || "Passkey verification failed.");
        return;
      }

      dispatch(
        setCredentials({ user: verifyData.user, token: verifyData.token })
      );
      toast.success(
        verifyData.message || "Biometric authentication verified!"
      );

      if (verifyData.user.role === ROLES.ADMIN) {
        router.push("/admin/dashboard");
      } else if (verifyData.user.role === ROLES.STAFF) {
        router.push("/staff/dashboard");
      } else {
        if (verifyData.user.hasAccount === false) {
          toast.info("Please complete your account opening application to activate your banking dashboard.");
          router.push("/customer/accounts/open");
        } else {
          router.push("/customer/dashboard");
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "NotAllowedError") {
        toast.info("Biometric prompt cancelled.");
      } else {
        toast.error(error.message || "Passkey authentication failed.");
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020b08] text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-600/15 rounded-full blur-[140px] animate-pulse-emerald" />
        <div className="absolute bottom-[5%] -left-[10%] w-[500px] h-[500px] bg-teal-800/10 rounded-full blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(52, 211, 153, 0.8) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
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
            Client Portal Sign In
          </h2>
          <p className="text-xs text-slate-400">
            Access your multi-currency vaults and institutional banking services.
          </p>
        </div>

        {/* 1-Click Demo Logins Bar */}
        {!requireTwoFactor && (
          <div className="glass-forest-pill rounded-2xl p-3.5 border border-emerald-500/20 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-1 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 font-mono">
                <KeyRound className="h-3 w-3 text-emerald-400" />
                1-Click Demo Credentials
              </span>
              <button
                type="button"
                onClick={handleSeedDatabase}
                disabled={autoSeeding}
                className="text-[10px] text-teal-400 hover:text-teal-300 hover:underline font-mono disabled:opacity-50"
              >
                {autoSeeding ? "Seeding..." : "Init / Reset DB"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials("admin")}
                className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 px-1.5 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-emerald-200 hover:bg-emerald-900/80 hover:text-white transition-colors truncate"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("staff")}
                className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-teal-950/70 border border-teal-500/30 px-1.5 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-teal-200 hover:bg-teal-900/80 hover:text-white transition-colors truncate"
              >
                <Users className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span className="truncate">Staff</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("customer")}
                className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 px-1.5 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-emerald-200 hover:bg-emerald-900/80 hover:text-white transition-colors truncate"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                <span className="truncate">Customer</span>
              </button>
            </div>
          </div>
        )}

        {/* Glass Card: Form Area */}
        <div className="glass-forest-card rounded-3xl p-6 sm:p-7 border border-emerald-500/25 shadow-2xl backdrop-blur-2xl">
          {requireTwoFactor ? (
            <form onSubmit={on2faSubmit} className="space-y-4">
              <div className="text-center space-y-1 pb-2">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 border border-emerald-400/30">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base text-white">
                  Two-Factor Verification
                </h3>
                <p className="text-xs text-slate-400">
                  Enter the 6-digit TOTP code generated by your Authenticator app.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase text-slate-300">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center font-mono text-2xl tracking-[0.3em] font-bold rounded-2xl bg-[#020e09] border border-emerald-500/40 px-4 py-3 text-emerald-300 focus:outline-hidden focus:border-emerald-400"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying2fa}
                className="w-full mt-2 py-3.5 rounded-xl bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all disabled:opacity-50"
              >
                {isVerifying2fa ? "Verifying Token..." : "Verify & Complete Sign In"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequireTwoFactor(false);
                  setTotpCode("");
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-emerald-300 mt-2 block"
              >
                ← Return to Email & Password
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="client@apexbank.com"
                leftIcon={<Mail className="h-4 w-4 text-emerald-400" />}
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label="Master Password"
                type="password"
                placeholder="••••••••••••"
                leftIcon={<Lock className="h-4 w-4 text-emerald-400" />}
                error={errors.password?.message}
                {...register("password")}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-xl bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <span>{isLoading ? "Authenticating..." : "Sign In to Banking Portal"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Passwordless Passkey Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-emerald-950" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono">
                  <span className="bg-[#041a12] px-3 py-0.5 rounded-full text-emerald-400/80 border border-emerald-500/20">
                    Or Passwordless WebAuthn
                  </span>
                </div>
              </div>

              {/* Biometric Passkey Button */}
              <button
                type="button"
                onClick={handlePasskeySignIn}
                disabled={isPasskeyLoading}
                className="w-full py-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-semibold"
              >
                <Fingerprint className="h-4 w-4 text-emerald-400" />
                <span>
                  {isPasskeyLoading ? "Reading Biometrics..." : "Sign In with Biometric Passkey"}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Footer Redirect & Trust Badges */}
        <div className="space-y-4 text-center">
          <p className="text-xs text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
            >
              Open a Verified Account
            </Link>
          </p>

          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 font-mono">
            <span>✓ Member FDIC</span>
            <span>✓ 256-Bit SSL</span>
            <span>✓ FIDO2 Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
