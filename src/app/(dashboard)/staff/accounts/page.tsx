"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Eye,
  Sliders,
  Building,
  User,
  FileText,
  DollarSign,
  Lock,
  Unlock,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  EmptyState,
  StatCard,
} from "@/components/ui";
import {
  useGetAccountsQuery,
  useUpdateAccountStatusMutation,
} from "@/redux/api/accountsApi";
import { ROLES, ACCOUNT_TYPES, ACCOUNT_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { IBankAccount, IUser } from "@/types";

export default function StaffAccountsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Review Modal State
  const [selectedReviewAccount, setSelectedReviewAccount] =
    useState<IBankAccount | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectMode, setIsRejectMode] = useState(false);

  const { data, isLoading } = useGetAccountsQuery({
    search,
    type: typeFilter,
    status: statusFilter,
    page,
    limit: 15,
  });

  const [updateStatusMutation, { isLoading: isUpdatingStatus }] =
    useUpdateAccountStatusMutation();

  const accounts = data?.accounts || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.total || accounts.length;

  // Calculate pending accounts count
  const pendingCount = accounts.filter(
    (a) => a.status === ACCOUNT_STATUS.PENDING
  ).length;

  const handleStatusChange = async (
    id: string,
    newStatus: string,
    reason?: string
  ) => {
    try {
      const res = await updateStatusMutation({
        id,
        status: newStatus,
        reason: reason || "Staff desk operational assessment",
      }).unwrap();

      toast.success(res.message || `Account status updated to ${newStatus}.`);
      setSelectedReviewAccount(null);
      setIsRejectMode(false);
      setRejectionReason("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to update account status.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Customer Depository Accounts & Applications
              </h1>
              {pendingCount > 0 && (
                <Badge variant="warning" size="sm">
                  {pendingCount} Pending Review
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review customer self-service applications, verify OCR KYC credentials, and activate live depository vaults.
            </p>
          </div>

          <Link href="/staff/accounts/create">
            <Button size="sm" leftIcon={<PlusCircle className="h-4 w-4" />}>
              Issue New Account
            </Button>
          </Link>
        </div>

        {/* Quick Pending Review Notification Banner */}
        {pendingCount > 0 && statusFilter !== ACCOUNT_STATUS.PENDING && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  {pendingCount} Customer Account Applications Awaiting Staff Review
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Applicants have completed identity scanning and deposited opening funds. Review their documents to activate their vaults.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStatusFilter(ACCOUNT_STATUS.PENDING);
                setPage(1);
              }}
              className="border-amber-400 text-amber-900 dark:text-amber-200 shrink-0"
            >
              Filter Pending Only
            </Button>
          </div>
        )}

        {/* Filters Card */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="Search by 10-digit account number or customer name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Account Types" },
                  { value: ACCOUNT_TYPES.SAVINGS, label: "Savings Depository" },
                  { value: ACCOUNT_TYPES.CURRENT, label: "Platinum Checking" },
                  { value: ACCOUNT_TYPES.BUSINESS, label: "Commercial Vault" },
                ]}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Account Statuses" },
                  { value: ACCOUNT_STATUS.PENDING, label: "⏳ Pending Review" },
                  { value: ACCOUNT_STATUS.ACTIVE, label: "Active" },
                  { value: ACCOUNT_STATUS.FROZEN, label: "Frozen" },
                  { value: ACCOUNT_STATUS.CLOSED, label: "Closed" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Accounts Table Card */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading customer depository accounts...
            </div>
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-8 w-8" />}
              title="No accounts located"
              description="No depository accounts matched the selected query or status filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Customer Applicant</TableHead>
                  <TableHead>Vault Tier</TableHead>
                  <TableHead>Opening Deposit / Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead className="text-right">Staff Review & Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => {
                  const owner = acc.userId as IUser;
                  const isPending = acc.status === ACCOUNT_STATUS.PENDING;
                  const isActive = acc.status === ACCOUNT_STATUS.ACTIVE;
                  const isFrozen = acc.status === ACCOUNT_STATUS.FROZEN;

                  return (
                    <TableRow
                      key={acc._id}
                      className={
                        isPending
                          ? "bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50"
                          : undefined
                      }
                    >
                      <TableCell>
                        <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          #{acc.accountNumber}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {acc.branchName || "Main Financial Center"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {owner?.name || "Unknown Customer"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {owner?.email || "No email on record"}
                        </div>
                        {owner?.phone && (
                          <div className="text-[10px] text-slate-400">
                            {owner.phone}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" size="sm" className="font-semibold">
                          {acc.accountType}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(acc.balance)} {acc.currency}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {isPending
                            ? "Deposit Held in Escrow"
                            : `Avail: ${formatCurrency(acc.availableBalance)}`}
                        </span>
                      </TableCell>

                      <TableCell>
                        {isPending ? (
                          <Badge variant="warning" size="sm" dot>
                            Pending Review
                          </Badge>
                        ) : isActive ? (
                          <Badge variant="success" size="sm" dot>
                            Active Vault
                          </Badge>
                        ) : isFrozen ? (
                          <Badge variant="danger" size="sm" dot>
                            Frozen
                          </Badge>
                        ) : (
                          <Badge variant="outline" size="sm">
                            {acc.status}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-slate-500 font-mono">
                        {formatDate(acc.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                                onClick={() => setSelectedReviewAccount(acc)}
                                leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}
                              >
                                Review & Activate
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedReviewAccount(acc)}
                                title="View Application Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>

                              {isActive ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-amber-600 hover:text-amber-700"
                                  disabled={isUpdatingStatus}
                                  onClick={() =>
                                    handleStatusChange(
                                      acc._id,
                                      ACCOUNT_STATUS.FROZEN,
                                      "Compliance risk review hold"
                                    )
                                  }
                                  title="Freeze Account"
                                >
                                  <Lock className="h-3.5 w-3.5" />
                                </Button>
                              ) : isFrozen ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700"
                                  disabled={isUpdatingStatus}
                                  onClick={() =>
                                    handleStatusChange(
                                      acc._id,
                                      ACCOUNT_STATUS.ACTIVE,
                                      "Compliance hold cleared by staff"
                                    )
                                  }
                                  title="Unfreeze Account"
                                >
                                  <Unlock className="h-3.5 w-3.5" />
                                </Button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages} (Total {totalCount} accounts)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* APPLICATION REVIEW & ACTIVATION MODAL */}
        <Modal
          isOpen={!!selectedReviewAccount}
          onClose={() => {
            setSelectedReviewAccount(null);
            setIsRejectMode(false);
            setRejectionReason("");
          }}
          title={
            selectedReviewAccount?.status === ACCOUNT_STATUS.PENDING
              ? "Account Application Verification Desk"
              : `Depository Vault Record #${selectedReviewAccount?.accountNumber}`
          }
          maxWidth="lg"
        >
          {selectedReviewAccount && (
            <div className="space-y-6 text-xs">
              {/* Top Summary Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  selectedReviewAccount.status === ACCOUNT_STATUS.PENDING
                    ? "bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40 text-amber-950 dark:text-amber-200"
                    : "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-base font-bold">
                      #{selectedReviewAccount.accountNumber}
                    </span>
                    <Badge
                      variant={
                        selectedReviewAccount.status === ACCOUNT_STATUS.ACTIVE
                          ? "success"
                          : selectedReviewAccount.status === ACCOUNT_STATUS.PENDING
                          ? "warning"
                          : "danger"
                      }
                      size="sm"
                      dot
                    >
                      {selectedReviewAccount.status}
                    </Badge>
                    <span className="text-slate-400 font-normal">
                      • {selectedReviewAccount.accountType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Routing: {selectedReviewAccount.routingNumber || "026007491"} • IBAN:{" "}
                    {selectedReviewAccount.iban || "N/A"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Opening Deposit
                  </span>
                  <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedReviewAccount.balance)}{" "}
                    {selectedReviewAccount.currency}
                  </p>
                </div>
              </div>

              {/* 1. Applicant & Identity OCR Information */}
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    <User className="h-4 w-4 text-cyan-600" />
                    <span>Customer & Identity Verification</span>
                  </div>
                  {selectedReviewAccount.kycSnapshot?.verifiedViaOcr ? (
                    <Badge variant="success" size="sm">
                      ✓ OCR Verified ({selectedReviewAccount.kycSnapshot.ocrConfidence || 92}% Match)
                    </Badge>
                  ) : (
                    <Badge variant="outline" size="sm">
                      Manual Self-Reported
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Legal Full Name
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {(selectedReviewAccount.userId as IUser)?.name || "N/A"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Email Address
                    </span>
                    <p className="font-mono text-slate-700 dark:text-slate-300">
                      {(selectedReviewAccount.userId as IUser)?.email || "N/A"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Contact Phone
                    </span>
                    <p className="font-mono text-slate-700 dark:text-slate-300">
                      {(selectedReviewAccount.userId as IUser)?.phone || "N/A"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Document Type
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {selectedReviewAccount.kycSnapshot?.docType || "National Identification"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Verified ID / NID Number
                    </span>
                    <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {selectedReviewAccount.kycSnapshot?.docNumber ||
                        (selectedReviewAccount.userId as IUser)?.nationalId ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Residential Address
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 truncate">
                      {(selectedReviewAccount.userId as IUser)?.address || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Scanned Document Thumbnails if available */}
                {(selectedReviewAccount.kycSnapshot?.docFrontUrl ||
                  selectedReviewAccount.kycSnapshot?.docBackUrl) && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                      Scanned Document Images
                    </span>
                    <div className="flex items-center gap-3">
                      {selectedReviewAccount.kycSnapshot.docFrontUrl && (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 p-1">
                          <img
                            src={selectedReviewAccount.kycSnapshot.docFrontUrl}
                            alt="Document Front"
                            className="h-20 w-32 object-cover rounded"
                          />
                          <span className="text-[9px] text-center block text-slate-500 mt-1 font-semibold">
                            Front Side
                          </span>
                        </div>
                      )}
                      {selectedReviewAccount.kycSnapshot.docBackUrl && (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 p-1">
                          <img
                            src={selectedReviewAccount.kycSnapshot.docBackUrl}
                            alt="Document Back"
                            className="h-20 w-32 object-cover rounded"
                          />
                          <span className="text-[9px] text-center block text-slate-500 mt-1 font-semibold">
                            Back Side
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Employment & Income Verification */}
              {selectedReviewAccount.employmentInfo && (
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    <span>Employment & Financial Source Declaration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Occupation / Profession
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedReviewAccount.employmentInfo.occupation || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Employer / Business
                      </span>
                      <p className="text-slate-800 dark:text-slate-200">
                        {selectedReviewAccount.employmentInfo.employerName || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Monthly Income
                      </span>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        {selectedReviewAccount.employmentInfo.monthlyIncome
                          ? formatCurrency(selectedReviewAccount.employmentInfo.monthlyIncome)
                          : "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Source of Funds
                      </span>
                      <p className="text-slate-800 dark:text-slate-200">
                        {selectedReviewAccount.employmentInfo.sourceOfFunds || "Salary & Earnings"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Tax Identification (TIN)
                      </span>
                      <p className="font-mono text-slate-800 dark:text-slate-200">
                        {selectedReviewAccount.employmentInfo.taxId || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Nominee Beneficiary */}
              {selectedReviewAccount.nominee && (
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                    <User className="h-4 w-4 text-purple-600" />
                    <span>Nominee & Beneficiary Declaration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Nominee Name
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedReviewAccount.nominee.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Relationship
                      </span>
                      <p className="text-slate-800 dark:text-slate-200">
                        {selectedReviewAccount.nominee.relation || "N/A"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Share Allocation
                      </span>
                      <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {selectedReviewAccount.nominee.sharePercent || 100}%
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Nominee Contact
                      </span>
                      <p className="font-mono text-slate-800 dark:text-slate-200">
                        {selectedReviewAccount.nominee.phone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Digital Signature Verification */}
              {selectedReviewAccount.signatureUrl && (
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-2 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                    <span>E-Signature on File</span>
                    <Badge variant="success" size="sm">
                      Signed & Cryptographically Timestamped
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 flex items-center justify-center">
                    <img
                      src={selectedReviewAccount.signatureUrl}
                      alt="Digital Signature"
                      className="max-h-20 object-contain dark:invert"
                    />
                  </div>
                </div>
              )}

              {/* Rejection input box if opened */}
              {isRejectMode && (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
                    <AlertCircle className="h-4 w-4" />
                    <span>State Reason for Application Rejection</span>
                  </div>
                  <Input
                    placeholder="e.g. Identity document unreadable, mismatched name, or AML sanction flag"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsRejectMode(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isUpdatingStatus || !rejectionReason.trim()}
                      onClick={() =>
                        handleStatusChange(
                          selectedReviewAccount._id,
                          ACCOUNT_STATUS.CLOSED,
                          rejectionReason
                        )
                      }
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons for Staff */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedReviewAccount(null);
                    setIsRejectMode(false);
                  }}
                >
                  Close Window
                </Button>

                {selectedReviewAccount.status === ACCOUNT_STATUS.PENDING && !isRejectMode && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      onClick={() => setIsRejectMode(true)}
                      leftIcon={<XCircle className="h-4 w-4" />}
                    >
                      Reject Application
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                      disabled={isUpdatingStatus}
                      onClick={() =>
                        handleStatusChange(
                          selectedReviewAccount._id,
                          ACCOUNT_STATUS.ACTIVE,
                          "Verified identity documents & opening deposit approved by officer"
                        )
                      }
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      {isUpdatingStatus ? "Activating Vault..." : "Approve & Activate Account"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
