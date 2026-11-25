"use client";

import React, { useState } from "react";
import {
  FileCheck,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
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
  Input,
  Select,
  Modal,
  EmptyState,
} from "@/components/ui";
import { useGetAllKycQuery, useReviewKycMutation } from "@/redux/api/kycApi";
import { ROLES, KYC_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { IUser, IKycDocument } from "@/types";

export default function AdminKycPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { data, isLoading } = useGetAllKycQuery({ status: statusFilter });
  const [reviewKycMutation, { isLoading: isReviewing }] = useReviewKycMutation();

  const customers: IUser[] = data?.customers || [];

  const [activeCustomer, setActiveCustomer] = useState<IUser | null>(null);
  const [activeDoc, setActiveDoc] = useState<IKycDocument | null>(null);
  const [remarks, setRemarks] = useState("");

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    if (!activeCustomer || !activeDoc || !activeDoc._id) return;

    try {
      const res = await reviewKycMutation({
        id: activeCustomer._id,
        docId: activeDoc._id,
        status,
        remarks: remarks || `Reviewed and ${status.toLowerCase()} by Compliance Administration.`,
      }).unwrap();

      toast.success(res.message);
      setActiveDoc(null);
      setActiveCustomer(null);
      setRemarks("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Review submission failed.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              KYC & Compliance Verification Queue
            </h1>
            <Badge variant="primary">FATF AML Standard</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review submitted government identification documents, audit validity, and authorize verified tier statuses.
          </p>
        </div>

        {/* Filter bar */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Filter by Review Status:
            </p>
            <div className="w-64">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Customers" },
                  { value: KYC_STATUS.PENDING, label: "Pending Verification" },
                  { value: KYC_STATUS.APPROVED, label: "Approved Documents" },
                  { value: KYC_STATUS.REJECTED, label: "Rejected Documents" },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table of customers with submitted KYC */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading compliance queue...
              </div>
            ) : customers.length === 0 ? (
              <EmptyState
                icon={<FileCheck className="h-8 w-8 text-indigo-500" />}
                title="No KYC submissions found"
                description="There are currently no customer identity documents in this queue."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead>Submitted Docs</TableHead>
                    <TableHead>KYC Standing</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => {
                    const docs = c.kycDocuments || [];
                    const pendingDocs = docs.filter(
                      (d) => d.status === KYC_STATUS.PENDING
                    );
                    return (
                      <TableRow key={c._id}>
                        <TableCell>
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                            {c.name}
                          </p>
                          <p className="text-[10px] text-slate-500">{c.email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="primary" size="sm">
                            {c.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {docs.map((d, i) => (
                              <Badge
                                key={i}
                                variant={
                                  d.status === KYC_STATUS.APPROVED
                                    ? "success"
                                    : d.status === KYC_STATUS.REJECTED
                                    ? "danger"
                                    : "warning"
                                }
                                size="sm"
                              >
                                {d.docType.replace("_", " ")}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={c.isVerified ? "success" : "warning"}
                            size="sm"
                            dot
                          >
                            {c.isVerified ? "Tier 2 Verified" : "Pending Review"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={pendingDocs.length > 0 ? "primary" : "outline"}
                            leftIcon={<Eye className="h-3.5 w-3.5" />}
                            onClick={() => {
                              setActiveCustomer(c);
                              setActiveDoc(docs[0] || null);
                            }}
                          >
                            Inspect Docs ({docs.length})
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal: Document Inspection & Approval */}
        <Modal
          isOpen={!!activeCustomer && !!activeDoc}
          onClose={() => {
            setActiveCustomer(null);
            setActiveDoc(null);
          }}
          title={`KYC Inspection: ${activeCustomer?.name || ""}`}
          description={`Customer ID: ${activeCustomer?._id || ""} • Reviewing ${activeDoc?.docType.replace(
            "_",
            " "
          ) || ""}`}
          maxWidth="2xl"
        >
          {activeDoc && (
            <div className="space-y-4 pt-2">
              {/* Document Switcher if customer has multiple docs */}
              {(activeCustomer?.kycDocuments || []).length > 1 && (
                <div className="flex gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  {activeCustomer?.kycDocuments?.map((d, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveDoc(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        activeDoc._id === d._id
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      {d.docType.replace("_", " ")} ({d.status})
                    </button>
                  ))}
                </div>
              )}

              {/* Document metadata banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">
                    Document Number:
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {activeDoc.docNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">
                    Submission Date:
                  </span>
                  <span className="font-medium text-slate-200">
                    {formatDate(activeDoc.submittedAt)}
                  </span>
                </div>
              </div>

              {/* Document Image Viewer */}
              <div className="max-h-80 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 bg-slate-950">
                {activeDoc.docUrl.startsWith("data:image") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activeDoc.docUrl}
                    alt="Document Scan"
                    className="max-h-72 object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-indigo-400" />
                    Document file attached (PDF / Encrypted scan)
                  </div>
                )}
              </div>

              {/* Compliance remarks input */}
              <Input
                label="Compliance Decision Remarks"
                placeholder="e.g. Government NID verified against central registry."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveCustomer(null);
                    setActiveDoc(null);
                  }}
                >
                  Close
                </Button>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    isLoading={isReviewing}
                    leftIcon={<XCircle className="h-4 w-4" />}
                    onClick={() => handleReview("REJECTED")}
                  >
                    Reject Document
                  </Button>

                  <Button
                    size="sm"
                    variant="primary"
                    isLoading={isReviewing}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    onClick={() => handleReview("APPROVED")}
                  >
                    Approve Document
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
