"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Wallet,
  Users,
  Lock,
  Zap,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  StatCard,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

export default function HomePage() {
  const [demoCount, setDemoCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Apex<span className="text-indigo-600 dark:text-indigo-400">Bank</span>
              </span>
              <span className="ml-2 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Core v1.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Platform
            </a>
            <a href="#roles" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Role Access
            </a>
            <a href="#architecture" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Architecture
            </a>
            <a href="#components-demo" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              UI System
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Open Account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 lg:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,rgba(99,102,241,0.1),transparent)] dark:bg-[radial-gradient(45rem_50rem_at_top,rgba(99,102,241,0.15),transparent)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-3.5 py-1 text-xs font-medium text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-950/60 dark:text-indigo-300 mb-6 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Phase 1 Initialized — Full Stack Redux Toolkit & UI System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Advanced Digital Banking <br />
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
              Management Platform
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Enterprise-grade digital banking system engineered with role-based governance,
            atomic ledger transactions, automated loan processing, and high-precision finance.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="shadow-lg shadow-indigo-500/25">
                Launch Portal
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                View Demo Roles
              </Button>
            </Link>
          </div>

          {/* Key Stat Cards Preview */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <StatCard
              title="Total Volume Managed"
              value="$128,450,920.00"
              change={14.8}
              changePeriod="vs last quarter"
              icon={<TrendingUp className="h-5 w-5" />}
              iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
            />
            <StatCard
              title="Active Accounts"
              value="24,850"
              change={8.2}
              changePeriod="new this month"
              icon={<Users className="h-5 w-5" />}
              iconBgColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
            />
            <StatCard
              title="Real-Time Transfers"
              value="99.998%"
              change={0}
              changePeriod="atomic consistency"
              icon={<Zap className="h-5 w-5" />}
              iconBgColor="bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
            />
            <StatCard
              title="Audit & Fraud Engine"
              value="ISO 27001"
              subtitle="End-to-end verified"
              icon={<ShieldCheck className="h-5 w-5" />}
              iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            />
          </div>
        </div>
      </section>

      {/* Role Architecture Section */}
      <section id="roles" className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="primary" className="mb-3">
              Role-Based Governance
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tri-Tier Strict Authorization
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Zero frontend-only trust. Every action is authenticated, role-verified, and cryptographically authorized.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Admin Card */}
            <Card className="relative overflow-hidden border-indigo-200 dark:border-indigo-900/60 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <Badge variant="primary">Full Clearance</Badge>
                </div>
                <CardTitle className="mt-4">System Administrator</CardTitle>
                <CardDescription>
                  Autonomous system authority and global banking governance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Real-time financial analytics & transaction volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Customer lifecycle, block & freeze authority</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Final loan approvals & disbursals</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Fraud & suspicious transaction rules engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Staff delegation & complete audit trail logging</span>
                </div>
              </CardContent>
            </Card>

            {/* Bank Staff Card */}
            <Card className="relative overflow-hidden border-sky-200 dark:border-sky-900/60 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-sky-600" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <Badge variant="info">Operational</Badge>
                </div>
                <CardTitle className="mt-4">Bank Staff Officer</CardTitle>
                <CardDescription>
                  Day-to-day branch desk operations and customer verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Register & verify KYC customer documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Provision savings, current & business accounts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Review customer deposits and withdrawal requests</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Assess loan requests & add internal risk notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Flag suspicious transfers to compliance officers</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Card */}
            <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-900/60 shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <Badge variant="success">Customer</Badge>
                </div>
                <CardTitle className="mt-4">Banking Customer</CardTitle>
                <CardDescription>
                  Self-service digital banking suite for modern individuals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Multi-account overview (Savings, Current, Business)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Instant intra-bank fund transfers with secure PIN</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Digital deposit and withdrawal requests</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Online loan applications & installment schedules</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>PDF receipts & CSV statement downloads</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reusable UI Components Showcase */}
      <section id="components-demo" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="default" className="mb-2">
              Phase 1 Verification
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Core UI Component Library
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Interactive preview of the reusable UI components implemented in Phase 1.
            </p>
          </div>

          <Tabs defaultValue="buttons" className="max-w-4xl mx-auto">
            <div className="flex justify-center">
              <TabsList>
                <TabsTrigger value="buttons">Buttons & Badges</TabsTrigger>
                <TabsTrigger value="table">Financial Table</TabsTrigger>
                <TabsTrigger value="state">Redux & Interactivity</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="buttons">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Button Variants & Sizes</h4>
                    <div className="flex flex-wrap gap-3 items-center">
                      <Button variant="primary">Primary Action</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="danger">Danger</Button>
                      <Button variant="success">Success</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button isLoading variant="primary">
                        Processing
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-sm font-semibold mb-3">Status Badges</h4>
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="success" dot>
                        Completed / Active
                      </Badge>
                      <Badge variant="warning" dot>
                        Pending Review
                      </Badge>
                      <Badge variant="danger" dot>
                        Rejected / Frozen
                      </Badge>
                      <Badge variant="primary" dot>
                        Processing
                      </Badge>
                      <Badge variant="info">Staff Note</Badge>
                      <Badge variant="outline">Savings Account</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="table">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs font-semibold">
                        TXN-8921-9840
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">Fund Transfer</span>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +$2,450.00
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" size="sm" dot>
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs font-semibold">
                        TXN-3829-1102
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">ATM Withdrawal</span>
                      </TableCell>
                      <TableCell className="font-semibold text-rose-600 dark:text-rose-400">
                        -$500.00
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning" size="sm" dot>
                          Pending
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="state">
              <Card className="p-6 text-center space-y-4">
                <h4 className="text-base font-semibold">Client Interactivity & Redux Store</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Redux store configured with 7 specialized slices, RTK Query API base query,
                  and typed dispatch/selector hooks.
                </p>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDemoCount((c) => Math.max(0, c - 1))}
                  >
                    Decrease
                  </Button>
                  <span className="font-mono text-xl font-bold px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {demoCount}
                  </span>
                  <Button
                    variant="primary"
                    onClick={() => setDemoCount((c) => c + 1)}
                  >
                    Increment
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-slate-50 py-12 dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Lock className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Apex Bank Enterprise Core
            </span>
            <span>—</span>
            <span>Next.js App Router, Redux Toolkit, RTK Query & MongoDB</span>
          </div>
          <p>© 2026 Apex Bank Systems. Built with precision for production fintech standards.</p>
        </div>
      </footer>
    </div>
  );
}
