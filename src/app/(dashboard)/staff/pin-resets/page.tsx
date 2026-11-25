"use client";

import React, { useState } from "react";
import {
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  User,
  Wallet,
  AlertCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Select,
  Modal,
  EmptyState,
} from "@/components/ui";
import {
  useGetPinResetRequestsQuery,
  useReviewPinResetRequestMutation,
} from "@/redux/api/staffApi";
import { ROLES, REQUEST_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDate } from "@/lib/utils";

interface UserAccount {
  accountNumber: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  status: string;
}

interface PinResetItem {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
  };
  reason: string;
  status: string;
  reviewedBy?: {
    name: string;
    role: string;
  };
  reviewedAt?: string;
  adminRemarks?: string;
  createdAt: string;
  updatedAt: string;
  userAccounts?: UserAccount[];
}

export default function StaffPinResetsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch } = useGetPinResetRequestsQuery(
    statusFilter !== "ALL" ? { status: statusFilter } : undefined
  );
  const [reviewMutation, { isLoading: isReviewing }] =
    useReviewPinResetRequestMutation();

  const requests: PinResetItem[] = (data?.requests as PinResetItem[]) || [];
  const pendingCount = data?.pendingCount || 0;

  // Selected request for action modal
  const [selectedRequest, setSelectedRequest] = useState<PinResetItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [remarks, setRemarks] = useState("");

  const openReviewModal = (req: PinResetItem, action: "APPROVE" | "REJECT") => {
    setSelectedRequest(req);
    setReviewAction(action);
    setRemarks(
      action === "APPROVE"
        ? "Identity verified. Transaction PIN cleared for customer reset."
        : ""
    );
  };

  const handleConfirmReview = async () => {
    if (!selectedRequest) return;
    if (reviewAction === "REJECT" && !remarks.trim()) {
      toast.error("Please provide a reason for rejecting the PIN reset request.");
      return;
    }

    try {
      const res = await reviewMutation({
        id: selectedRequest._id,
        action: reviewAction,
        remarks: remarks.trim() || undefined,
      }).unwrap();

      toast.success(res.message || `PIN reset request ${reviewAction.toLowerCase()}d successfully.`);
      setSelectedRequest(null);
      setRemarks("");
      refetch();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to process review.");
    }
  };

  // Filter requests by search query
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = r.userId?.name?.toLowerCase() || "";
    const email = r.userId?.email?.toLowerCase() || "";
    const phone = r.userId?.phone?.toLowerCase() || "";
    const reason = r.reason?.toLowerCase() || "";
    return name.includes(q) || email.includes(q) || phone.includes(q) || reason.includes(q);
  });

  const approvedCount = requests.filter((r) => r.status === REQUEST_STATUS.APPROVED).length;
  const rejectedCount = requests.filter((r) => r.status === REQUEST_STATUS.REJECTED).length;

  return (
    <DashboardLayout allowedRoles={[ROLES.STAFF, ROLES.ADMIN]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Customer PIN Reset Desk
              </h1>
              <Badge variant="warning">Security Desk</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verify customer identities and securely authorize transaction PIN resets per Bangladesh Bank guidelines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<Clock className="h-3.5 w-3.5" />}
            >
              Refresh Queue
            </Button>
          </div>
        </div>

        {/* Stats KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pending Review
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {pendingCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Approved Resets
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {approvedCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Rejected Requests
                </p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {rejectedCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                <XCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Processed
                </p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {requests.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Filter Status:
            </span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "ALL", label: "All Requests" },
                { value: REQUEST_STATUS.PENDING, label: "Pending Review" },
                { value: REQUEST_STATUS.APPROVED, label: "Approved" },
                { value: REQUEST_STATUS.REJECTED, label: "Rejected" },
              ]}
              className="w-40 text-xs"
            />
          </div>
        </div>

        {/* Main Requests Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Loading PIN reset requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <EmptyState
                icon={<KeyRound className="h-10 w-10 text-slate-400" />}
                title="No PIN Reset Requests Found"
                description={
                  statusFilter === "ALL"
                    ? "There are currently no customer transaction PIN reset requests in the queue."
                    : `No ${statusFilter.toLowerCase()} requests match your current filter.`
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Particulars</TableHead>
                    <TableHead>Associated Accounts</TableHead>
                    <TableHead>Reset Reason & Date</TableHead>
                    <TableHead>Review Status</TableHead>
                    <TableHead>Officer Audit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => {
                    const isPending = req.status === REQUEST_STATUS.PENDING;
                    const isApproved = req.status === REQUEST_STATUS.APPROVED;

                    return (
                      <TableRow key={req._id}>
                        {/* Customer Info */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                              {req.userId?.name ? req.userId.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {req.userId?.name || "Unknown Customer"}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {req.userId?.email}
                              </p>
                              {req.userId?.phone && (
                                <p className="text-[10px] text-slate-400">
                                  {req.userId.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Accounts */}
                        <TableCell>
                          {req.userAccounts && req.userAccounts.length > 0 ? (
                            <div className="space-y-1">
                              {req.userAccounts.slice(0, 2).map((acc) => (
                                <div
                                  key={acc.accountNumber}
                                  className="text-[11px] flex items-center gap-1.5"
                                >
                                  <Wallet className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                    #{acc.accountNumber}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    ({acc.accountType})
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 ml-auto">
                                    {formatCurrency(acc.balance)}
                                  </span>
                                </div>
                              ))}
                              {req.userAccounts.length > 2 && (
                                <p className="text-[10px] text-slate-400">
                                  +{req.userAccounts.length - 2} more accounts
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No active accounts</span>
                          )}
                        </TableCell>

                        {/* Reason */}
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2">
                              &quot;{req.reason}&quot;
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Requested {formatDate(req.createdAt)}
                            </p>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            variant={
                              isApproved ? "success" : isPending ? "warning" : "danger"
                            }
                            size="sm"
                          >
                            {req.status}
                          </Badge>
                        </TableCell>

                        {/* Officer Audit */}
                        <TableCell>
                          {req.reviewedBy ? (
                            <div className="text-[11px]">
                              <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <User className="h-3 w-3 text-slate-400" />
                                {req.reviewedBy.name}
                              </p>
                              {req.reviewedAt && (
                                <p className="text-[10px] text-slate-400">
                                  {formatDate(req.reviewedAt)}
                                </p>
                              )}
                              {req.adminRemarks && (
                                <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">
                                  &quot;{req.adminRemarks}&quot;
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Awaiting officer</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs"
                                onClick={() => openReviewModal(req, "APPROVE")}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs"
                                onClick={() => openReviewModal(req, "REJECT")}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Resolved</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal: Approve or Reject Review */}
        <Modal
          isOpen={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          title={
            reviewAction === "APPROVE"
              ? "Approve Customer PIN Reset"
              : "Reject Customer PIN Reset"
          }
          description={
            reviewAction === "APPROVE"
              ? `You are clearing the transaction PIN for customer "${selectedRequest?.userId?.name}". They will be able to setup a fresh PIN immediately.`
              : `Specify the regulatory reason for rejecting the PIN reset request for "${selectedRequest?.userId?.name}".`
          }
        >
          <div className="space-y-4 pt-2">
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                reviewAction === "APPROVE"
                  ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60"
                  : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
              }`}
            >
              {reviewAction === "APPROVE" ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                  {reviewAction === "APPROVE"
                    ? "Security Reset Confirmation"
                    : "Rejection Advisory"}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {reviewAction === "APPROVE"
                    ? "Clearing the transaction PIN allows the account holder to configure a new PIN without knowing the current one. Ensure customer credentials have been verified."
                    : "The customer will receive an immediate in-app notification detailing your remarks."}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Officer Remarks {reviewAction === "REJECT" && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  reviewAction === "APPROVE"
                    ? "e.g. Identity verified via registered phone and NID document."
                    : "e.g. Identity could not be verified. Please visit your nearest branch."
                }
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required={reviewAction === "REJECT"}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant={reviewAction === "APPROVE" ? "primary" : "danger"}
                isLoading={isReviewing}
                onClick={handleConfirmReview}
              >
                {reviewAction === "APPROVE" ? "Confirm & Clear PIN" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
