"use client";

import React from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  CreditCard,
  Building,
  Landmark,
  ShieldCheck,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { useGetCustomerDashboardQuery } from "@/redux/api/dashboardApi";
import { formatCurrency, formatAmount } from "@/lib/money";
import { formatDateTime, maskAccountNumber } from "@/lib/utils";
import { ROLES, ACCOUNT_STATUS } from "@/lib/constants";

export default function CustomerDashboardPage() {
  const { data } = useGetCustomerDashboardQuery();
  const dashboard = data?.data;
  const pendingAccounts = (dashboard?.accounts || []).filter(
    (a) => a.status === ACCOUNT_STATUS.PENDING
  );

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Personal Banking Overview
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time portfolio balances, intra-bank transfers, and credit facilities.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/customer/transfer">
              <Button size="sm" leftIcon={<ArrowLeftRight className="h-4 w-4" />}>
                Send Money
              </Button>
            </Link>
            <Link href="/customer/deposit">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowDownToLine className="h-4 w-4" />}
              >
                Deposit
              </Button>
            </Link>
            <Link href="/customer/withdraw">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowUpFromLine className="h-4 w-4" />}
              >
                Withdraw
              </Button>
            </Link>
          </div>
        </div>

        {/* Pending Review Alert Banner for Customers */}
        {pendingAccounts.length > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 flex items-start gap-3.5 shadow-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Bank Account Application Under Review ({pendingAccounts.length})
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                Your account application for #{pendingAccounts[0]?.accountNumber} is currently queued for verification by a bank officer. Outgoing transfers and debit card facilities will be unlocked once approved.
              </p>
            </div>
          </div>
        )}

        {/* Balance KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Combined Balance"
            value={formatCurrency(dashboard?.totalBalance || 0)}
            icon={<Wallet className="h-5 w-5" />}
            subtitle="Across all accounts"
            iconBgColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
          />
          <StatCard
            title="Available to Spend"
            value={formatCurrency(dashboard?.availableBalance || 0)}
            icon={<CreditCard className="h-5 w-5" />}
            subtitle="Net of minimum reserves"
            iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          />
          <StatCard
            title="Lifetime Inflows"
            value={formatCurrency(dashboard?.totalDeposits || 0)}
            icon={<ArrowDownToLine className="h-5 w-5" />}
            subtitle="Cleared credits & deposits"
            iconBgColor="bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
          />
          <StatCard
            title="Active Credit Balance"
            value={formatCurrency(
              dashboard?.activeLoans?.reduce(
                (acc, l) => acc + l.remainingBalance,
                0
              ) || 0
            )}
            icon={<Landmark className="h-5 w-5" />}
            subtitle={`${dashboard?.activeLoans?.length || 0} active loans`}
            iconBgColor="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
          />
        </div>

        {/* My Bank Accounts Card Carousel/List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              My Depository Accounts
            </h3>
            <Link
              href="/customer/accounts"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              View details ({dashboard?.accounts?.length || 0}) →
            </Link>
          </div>

          {(dashboard?.accounts || []).length === 0 ? (
            <Card className="p-8 border-dashed border-slate-300 dark:border-slate-800 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-3">
                <Building className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                No Depository Accounts Linked
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Open your first smart depository account with OCR identity verification and initial deposit to start sending money, earning interest, and managing cards.
              </p>
              <div className="mt-4">
                <Link href="/customer/accounts/open">
                  <Button size="sm">Open Bank Account Now</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard?.accounts.map((acc) => (
                <Card
                  key={acc._id}
                  className="p-5 border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        <Building className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          {acc.accountType}
                        </span>
                        <span className="block text-[11px] font-mono text-slate-400">
                          {maskAccountNumber(acc.accountNumber)}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        acc.status === ACCOUNT_STATUS.ACTIVE
                          ? "success"
                          : "warning"
                      }
                      size="sm"
                      dot
                    >
                      {acc.status}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Current Balance
                    </span>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(acc.balance)}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Available: {formatCurrency(acc.availableBalance)}</span>
                      <span>Min: {formatCurrency(acc.minimumBalance)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Inflow vs Outflow */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cash Flow Trends</CardTitle>
                  <CardDescription>
                    Monthly comparisons of money deposited vs spent/transferred.
                  </CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard?.monthlyActivity || []}>
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
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar
                      dataKey="moneyIn"
                      name="Money In"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="moneyOut"
                      name="Money Out"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Transfer Shortcut */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Instant Intra-Bank Transfers
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Encrypted with 4-Digit PIN
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Send money immediately to any account number within Apex Bank with real-time atomic balance settlement.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <Link href="/customer/transfer" className="block">
                <Button size="md" className="w-full">
                  Initiate Transfer
                </Button>
              </Link>
              <Link href="/customer/transactions" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Full Statement History
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Transactions Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest debits, credits, and intra-bank transfers.
                </CardDescription>
              </div>
              <Link
                href="/customer/transactions"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                View all statements →
              </Link>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dashboard?.recentTransactions || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs py-8 text-slate-400">
                    No transactions yet on your accounts.
                  </TableCell>
                </TableRow>
              ) : (
                (dashboard?.recentTransactions || []).map((tx) => {
                  return (
                    <TableRow key={tx._id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {tx.transactionId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" size="sm">
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                        {tx.description}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" size="sm" dot>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500 font-mono">
                        {formatDateTime(tx.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
