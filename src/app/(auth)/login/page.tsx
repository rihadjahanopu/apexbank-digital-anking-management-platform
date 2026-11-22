"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  Users,
  KeyRound,
  Fingerprint,
} from "lucide-react";
import { toast } from "sonner";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { useLoginMutation } from "@/redux/api/authApi";
import { useLogin2faMutation } from "@/redux/api/twoFactorApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/authSlice";
import { Button, Input, Card, CardContent } from "@/components/ui";
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

      if ((response as unknown as { requireTwoFactor?: boolean; tempToken?: string }).requireTwoFactor) {
        const resp2fa = response as unknown as { tempToken: string };
        setRequireTwoFactor(true);
        setTempToken(resp2fa.tempToken);
        toast.info("Two-Factor Authentication required. Enter your 6-digit code.");
        return;
      }

      dispatch(
        setCredentials({ user: response.user, token: response.token })
      );
      toast.success(response.message || "Logged in successfully!");

      // Role-based routing
      if (response.user.role === ROLES.ADMIN) {
        router.push("/admin/dashboard");
      } else if (response.user.role === ROLES.STAFF) {
        router.push("/staff/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Login failed. Please verify credentials.");
    }
  };

  const on2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCode || totpCode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit authenticator code.");
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
      toast.success(response.message || "Logged in successfully!");

      if (response.user.role === ROLES.ADMIN) {
        router.push("/admin/dashboard");
      } else if (response.user.role === ROLES.STAFF) {
        router.push("/staff/dashboard");
      } else {
        router.push("/customer/dashboard");
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

      // 1. Get authentication options from server
      const optRes = await fetch("/api/auth/passkey/login-options", {
        method: "POST",
        credentials: "include",
      });
      const optData = await optRes.json();
      if (!optData.success) {
        toast.error(optData.error || "Failed to initiate passkey sign-in.");
        return;
      }

      // 2. Perform native WebAuthn authentication prompt via @simplewebauthn/browser
      const credential = await startAuthentication({
        optionsJSON: optData.options,
      });

      // 3. Verify assertion with server
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
        // Signal API support check per modern web guidance
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
        router.push("/customer/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
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
            Welcome to Secure Banking
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to access your digital accounts and banking services.
          </p>
        </div>

        {/* Demo Role Selector Bar */}
        {!requireTwoFactor && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-950/80 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                1-Click Demo Logins
              </span>
              <button
                onClick={handleSeedDatabase}
                disabled={autoSeeding}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium disabled:opacity-50"
              >
                {autoSeeding ? "Seeding..." : "Init / Reset Demo DB"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials("admin")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("staff")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-sky-600" />
                Staff
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials("customer")}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                Customer
              </button>
            </div>
          </div>
        )}

        {/* Login or 2FA Card */}
        {requireTwoFactor ? (
          <Card className="shadow-lg border-slate-200/90 dark:border-slate-800">
            <CardContent className="p-6 pt-6">
              <form onSubmit={on2faSubmit} className="space-y-4">
                <div className="text-center space-y-1 pb-2">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-2">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Two-Factor Verification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter the 6-digit verification code generated by your Authenticator app.
                  </p>
                </div>

                <Input
                  label="6-Digit TOTP Code"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center font-mono text-xl tracking-widest font-bold"
                  required
                  autoFocus
                />

                <Button
                  type="submit"
                  className="w-full mt-2"
                  size="lg"
                  isLoading={isVerifying2fa}
                >
                  Verify & Complete Sign In
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setRequireTwoFactor(false);
                    setTotpCode("");
                  }}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 mt-2 block"
                >
                  ← Back to Email & Password
                </button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg border-slate-200/90 dark:border-slate-800">
            <CardContent className="p-6 pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@apexbank.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register("email")}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  {...register("password")}
                />

                <Button
                  type="submit"
                  className="w-full mt-2"
                  size="lg"
                  isLoading={isLoading}
                >
                  Sign In to Banking Portal
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">
                      Or passwordless login
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40"
                  leftIcon={<Fingerprint className="h-5 w-5 text-indigo-500" />}
                  isLoading={isPasskeyLoading}
                  onClick={handlePasskeySignIn}
                >
                  Sign In with Passkey / Biometrics
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer Links */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Open an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
