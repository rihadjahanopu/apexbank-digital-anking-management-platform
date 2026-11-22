"use client";

import React from "react";
import Link from "next/link";
import {
  UserCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileCheck,
  UserPlus,
  PlusCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { useGetStaffDashboardQuery } from "@/redux/api/dashboardApi";
import { ROLES } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { IBankAccount } from "@/types";

export default function StaffDashboardPage() {
  const { data, isLoading } = useGetStaffDashboardQuery();
  const stats = data?.data;

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Branch Operational Desk
              </h1>
              <Badge variant="info">Officer Console</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Process customer KYC verifications, deposit check clearances, cash withdrawals, and credit files.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/staff/customers/register">
              <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
                Onboard Customer
              </Button>
            </Link>
            <Link href="/staff/accounts/create">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<PlusCircle className="h-4 w-4" />}
              >
                Issue Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational Attention Queue Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending KYC Verifications"
            value={stats?.pendingVerifications ?? (isLoading ? "..." : 0)}
            icon={<UserCheck className="h-5 w-5" />}
            subtitle="Customer identity documents"
            iconBgColor="bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
          />
          <StatCard
            title="Pending Deposit Checks"
            value={stats?.pendingDeposits ?? (isLoading ? "..." : 0)}
            icon={<ArrowDownToLine className="h-5 w-5" />}
            subtitle="Awaiting desk review"
            iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          />
          <StatCard
            title="Withdrawal Authorizations"
            value={stats?.pendingWithdrawals ?? (isLoading ? "..." : 0)}
            icon={<ArrowUpFromLine className="h-5 w-5" />}
            subtitle="Customer cash requests"
            iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
          />
          <StatCard
            title="Loans Awaiting Review"
            value={stats?.pendingLoans ?? (isLoading ? "..." : 0)}
            icon={<FileCheck className="h-5 w-5" />}
            subtitle="Credit underwriting queue"
            iconBgColor="bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
          />
        </div>

        {/* Quick Action Desk Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-indigo-500 transition-all">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-2">
                <ArrowDownToLine className="h-5 w-5" />
              </div>
              <CardTitle>Deposit Processing Desk</CardTitle>
              <CardDescription>
                Validate deposited funds, verify transaction slips, and credit customer balances.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/staff/deposits">
                <Button variant="outline" size="sm" className="w-full">
                  Process Deposits ({stats?.pendingDeposits || 0})
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-sky-500 transition-all">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400 mb-2">
                <ArrowUpFromLine className="h-5 w-5" />
              </div>
              <CardTitle>Withdrawal Review Desk</CardTitle>
              <CardDescription>
                Check available balance reserves and authorize cash withdrawal disbursements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/staff/withdrawals">
                <Button variant="outline" size="sm" className="w-full">
                  Process Withdrawals ({stats?.pendingWithdrawals || 0})
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-purple-500 transition-all">
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 mb-2">
                <FileCheck className="h-5 w-5" />
              </div>
              <CardTitle>Loan Risk Underwriting</CardTitle>
              <CardDescription>
                Evaluate applicant income, write internal officer notes, and forward to Admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/staff/loans">
                <Button variant="outline" size="sm" className="w-full">
                  Review Loans ({stats?.pendingLoans || 0})
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Branch Live Ledger Stream */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Branch Real-Time Transaction Stream</CardTitle>
                <CardDescription>
                  Continuous log of cleared transfers, counter deposits, and cash debits.
                </CardDescription>
              </div>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sender / Payer</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(stats?.recentTransactions || []).map((tx) => {
                const sender = tx.senderAccount as IBankAccount;
                const receiver = tx.receiverAccount as IBankAccount;
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
                    <TableCell className="text-xs">
                      {sender ? `Acc #${sender.accountNumber}` : "Branch Counter"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {receiver ? `Acc #${receiver.accountNumber}` : "Cash Disbursement"}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tx.isSuspicious ? "danger" : "success"}
                        size="sm"
                        dot
                      >
                        {tx.isSuspicious ? "FLAGGED" : tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-500 font-mono">
                      {formatDateTime(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
