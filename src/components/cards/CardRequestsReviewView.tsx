"use client";

import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
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
  useGetAllCardRequestsQuery,
  useReviewCardRequestMutation,
} from "@/redux/api/cardsApi";
import {
  UserRole,
  REQUEST_STATUS,
  CARD_REQUEST_TYPES,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ICardRequest, IUser, IBankAccount, ICard } from "@/types";

interface CardRequestsReviewViewProps {
  allowedRoles: UserRole[];
  pageTitle: string;
}

export const CardRequestsReviewView: React.FC<CardRequestsReviewViewProps> = ({
  allowedRoles,
  pageTitle,
}) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const queryParams: { status?: string; requestType?: string; page: number; limit: number } = {
    page,
    limit: 20,
  };
  if (statusFilter !== "ALL") queryParams.status = statusFilter;
  if (typeFilter !== "ALL") queryParams.requestType = typeFilter;

  const { data, isLoading } = useGetAllCardRequestsQuery(queryParams);
  const [reviewMutation, { isLoading: isReviewing }] = useReviewCardRequestMutation();

  const requests: ICardRequest[] = data?.data || [];
  const meta = data?.meta;

  const [selectedRequest, setSelectedRequest] = useState<ICardRequest | null>(null);
  const [adminRemarks, setAdminRemarks] = useState("");

  const handleReview = async (action: "APPROVE" | "REJECT") => {
    if (!selectedRequest) return;

    try {
      const res = await reviewMutation({
        id: selectedRequest._id,
        action,
        adminRemarks: adminRemarks.trim() || undefined,
      }).unwrap();

      toast.success(res.message);
      setSelectedRequest(null);
      setAdminRemarks("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to process review.");
    }
  };

  return (
    <DashboardLayout allowedRoles={allowedRoles}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {pageTitle}
            </h1>
            <Badge variant="primary">Card Governance</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review customer card issuance and card cancellation/removal requests with full audit integrity.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <Select
              label="Request Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: REQUEST_STATUS.PENDING, label: "Pending Review" },
                { value: REQUEST_STATUS.APPROVED, label: "Approved" },
                { value: REQUEST_STATUS.REJECTED, label: "Rejected" },
              ]}
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              label="Request Type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "ALL", label: "All Types" },
                { value: CARD_REQUEST_TYPES.ISSUE, label: "New Card Issue" },
                { value: CARD_REQUEST_TYPES.REMOVE, label: "Card Cancellation / Removal" },
              ]}
            />
          </div>
        </div>

        {/* Requests Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading card requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={<CreditCard className="h-8 w-8 text-slate-400" />}
                  title="No card requests found"
                  description="There are no card requests matching the active filters."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Card Details</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => {
                    const customer = req.userId as IUser;
                    const account = req.accountId as IBankAccount;
                    const targetCard = req.cardId as ICard | undefined;
                    const issuedCard = req.issuedCardId as ICard | undefined;

                    return (
                      <TableRow key={req._id}>
                        <TableCell>
                          <Badge
                            variant={
                              req.requestType === CARD_REQUEST_TYPES.ISSUE
                                ? "primary"
                                : "danger"
                            }
                            size="sm"
                          >
                            {req.requestType === CARD_REQUEST_TYPES.ISSUE
                              ? "ISSUE CARD"
                              : "REMOVE CARD"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                              {customer?.name || "Customer"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {customer?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col font-mono text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {account?.accountNumber || "N/A"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {account?.accountType}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {req.requestType === CARD_REQUEST_TYPES.ISSUE ? (
                            <div className="flex flex-col text-xs">
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {req.network} {req.cardType}
                              </span>
                              {issuedCard && (
                                <span className="font-mono text-[10px] text-emerald-500 font-bold">
                                  Issued: {issuedCard.maskedCardNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col text-xs font-mono">
                              <span className="font-medium text-rose-500">
                                {targetCard?.maskedCardNumber || "Card"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {targetCard?.network} {targetCard?.cardType}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <span
                            className="text-xs text-slate-600 dark:text-slate-300 truncate block"
                            title={req.reason}
                          >
                            {req.reason}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              req.status === REQUEST_STATUS.APPROVED
                                ? "success"
                                : req.status === REQUEST_STATUS.REJECTED
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                            dot
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {formatDate(req.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === REQUEST_STATUS.PENDING ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(req);
                                setAdminRemarks("");
                              }}
                            >
                              Review
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {req.status === REQUEST_STATUS.APPROVED
                                ? "Approved"
                                : "Rejected"}
                            </span>
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

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>
              Page {meta.page} of {meta.totalPages} ({meta.total} total requests)
            </span>
            <div className="flex gap-2">
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
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Review Modal */}
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`Review Card ${
            selectedRequest?.requestType === CARD_REQUEST_TYPES.ISSUE
              ? "Issue"
              : "Removal"
          } Request`}
          description="Verify customer details, provide mandatory audit notes, and approve or decline the request."
        >
          {selectedRequest && (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2 bg-slate-50 dark:bg-slate-900/40 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {(selectedRequest.userId as IUser)?.name} (
                    {(selectedRequest.userId as IUser)?.email})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Linked Account:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {(selectedRequest.accountId as IBankAccount)?.accountNumber} (
                    {(selectedRequest.accountId as IBankAccount)?.accountType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Request Action:</span>
                  <Badge
                    variant={
                      selectedRequest.requestType === CARD_REQUEST_TYPES.ISSUE
                        ? "primary"
                        : "danger"
                    }
                    size="sm"
                  >
                    {selectedRequest.requestType}
                  </Badge>
                </div>
                {selectedRequest.requestType === CARD_REQUEST_TYPES.ISSUE ? (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Requested Card:</span>
                    <span className="font-semibold">
                      {selectedRequest.network} {selectedRequest.cardType}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Card to Block:</span>
                    <span className="font-mono text-rose-500 font-bold">
                      {(selectedRequest.cardId as ICard)?.maskedCardNumber || "Card"}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">Customer Reason:</span>
                  <p className="p-2 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 italic">
                    &ldquo;{selectedRequest.reason}&rdquo;
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Officer Remarks / Audit Reason:
                </label>
                <textarea
                  rows={3}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g. Identity verified via internal records. Approved."
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={isReviewing}
                  leftIcon={<XCircle className="h-4 w-4" />}
                  onClick={() => handleReview("REJECT")}
                >
                  Reject Request
                </Button>
                <Button
                  size="sm"
                  isLoading={isReviewing}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => handleReview("APPROVE")}
                >
                  {selectedRequest.requestType === CARD_REQUEST_TYPES.ISSUE
                    ? "Approve & Issue Card"
                    : "Approve & Block Card"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};
export default CardRequestsReviewView;
