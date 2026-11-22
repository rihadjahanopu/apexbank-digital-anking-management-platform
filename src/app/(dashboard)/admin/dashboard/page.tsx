"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  Landmark,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ShieldAlert,
  Clock,
  TrendingUp,
  FileCheck,
  Building,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
} from "@/components/ui";
import { useGetAdminDashboardQuery } from "@/redux/api/dashboardApi";
import { formatCurrency, formatAmount } from "@/lib/money";
import { ROLES } from "@/lib/constants";

export default function AdminDashboardPage() {
  const { data, isLoading } = useGetAdminDashboardQuery();
  const stats = data?.data;

  const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Executive Banking Overview
              </h1>
              <Badge variant="primary">Admin Clearance</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time balance capitalization, liquidity, risk detection, and portfolio performance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/admin/suspicious">
              <Button
                variant={stats && stats.suspiciousTransactions > 0 ? "danger" : "outline"}
                size="sm"
                leftIcon={<ShieldAlert className="h-4 w-4" />}
              >
                Suspicious ({stats?.suspiciousTransactions || 0})
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" size="sm">
                Banking Rules
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Financial KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Bank Vault Liquidity"
            value={formatCurrency(stats?.totalBankBalance || 0)}
            icon={<Building className="h-5 w-5" />}
            subtitle="Combined account deposits"
            iconBgColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
          />
          <StatCard
            title="Total Registered Customers"
            value={stats?.totalCustomers ?? (isLoading ? "..." : 0)}
            icon={<Users className="h-5 w-5" />}
            subtitle="Verified banking profiles"
            iconBgColor="bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
          />
          <StatCard
            title="Active Bank Accounts"
            value={stats?.totalBankAccounts ?? (isLoading ? "..." : 0)}
            icon={<Wallet className="h-5 w-5" />}
            subtitle="Savings, Current & Business"
            iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          />
          <StatCard
            title="Total Transaction Volume"
            value={formatCurrency(stats?.totalDeposits || 0)}
            icon={<TrendingUp className="h-5 w-5" />}
            subtitle={`${stats?.totalTransactions || 0} ledger records`}
            iconBgColor="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
          />
        </div>

        {/* Operational Attention Queue Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-amber-200 dark:border-amber-950/60 bg-amber-50/30 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Pending Deposits
              </span>
              <ArrowDownToLine className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.pendingDepositRequests || 0}
            </div>
            <Link
              href="/admin/deposits"
              className="mt-1 text-[11px] text-amber-700 dark:text-amber-400 hover:underline block"
            >
              Review queue →
            </Link>
          </Card>

          <Card className="p-4 border-orange-200 dark:border-orange-950/60 bg-orange-50/30 dark:bg-orange-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-800 dark:text-orange-300">
                Pending Withdrawals
              </span>
              <ArrowUpFromLine className="h-4 w-4 text-orange-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.pendingWithdrawalRequests || 0}
            </div>
            <Link
              href="/admin/withdrawals"
              className="mt-1 text-[11px] text-orange-700 dark:text-orange-400 hover:underline block"
            >
              Review queue →
            </Link>
          </Card>

          <Card className="p-4 border-blue-200 dark:border-blue-950/60 bg-blue-50/30 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                Loan Applications
              </span>
              <FileCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.pendingLoanApplications || 0}
            </div>
            <Link
              href="/admin/loans"
              className="mt-1 text-[11px] text-blue-700 dark:text-blue-400 hover:underline block"
            >
              Review portfolio →
            </Link>
          </Card>

          <Card className="p-4 border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                Fraud Flags
              </span>
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats?.suspiciousTransactions || 0}
            </div>
            <Link
              href="/admin/suspicious"
              className="mt-1 text-[11px] text-rose-700 dark:text-rose-400 hover:underline block"
            >
              Security watch →
            </Link>
          </Card>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Transaction Volume Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction Volume Trends</CardTitle>
                  <CardDescription>
                    Gross financial clearing volume over the past 6 months.
                  </CardDescription>
                </div>
                <ArrowLeftRight className="h-5 w-5 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.monthlyVolume || []}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickFormatter={(val) => `$${formatAmount(val)}`}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [
                        formatCurrency(Number(val) || 0),
                        "Volume",
                      ]}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#volGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Deposits vs Withdrawals Comparison */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Deposits vs Withdrawals</CardTitle>
                  <CardDescription>
                    Cash inflow vs outflow comparisons over time.
                  </CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.depositsVsWithdrawals || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickFormatter={(val) => `$${formatAmount(val)}`}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [
                        formatCurrency(Number(val) || 0),
                      ]}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar
                      dataKey="deposits"
                      name="Deposits In"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="withdrawals"
                      name="Withdrawals Out"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lower Row: Account Distribution & Quick Action Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Distribution */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Account Distribution</CardTitle>
              <CardDescription>
                Active portfolio breakdown by product.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.accountDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(stats?.accountDistribution || []).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Administration Hub */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Management Control Hub</CardTitle>
              <CardDescription>
                Direct access to high-clearance administrative workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/admin/customers"
                className="group flex items-start gap-4 rounded-xl border border-slate-200/80 p-4 hover:border-indigo-500 hover:shadow-xs dark:border-slate-800 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Customer Lifecycle
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Manage KYC verification status, customer deactivation, and fraud blocking.
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/accounts"
                className="group flex items-start gap-4 rounded-xl border border-slate-200/80 p-4 hover:border-indigo-500 hover:shadow-xs dark:border-slate-800 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Account Controls
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Freeze suspicious accounts, adjust daily limits, or close depleted vaults.
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/loans"
                className="group flex items-start gap-4 rounded-xl border border-slate-200/80 p-4 hover:border-indigo-500 hover:shadow-xs dark:border-slate-800 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Loan Underwriting
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Approve and disburse evaluated personal, business, and mortgage credits.
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/audit-logs"
                className="group flex items-start gap-4 rounded-xl border border-slate-200/80 p-4 hover:border-indigo-500 hover:shadow-xs dark:border-slate-800 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Compliance Audit Trail
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Immutable event log of every authentication, balance adjustment, and setting change.
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
