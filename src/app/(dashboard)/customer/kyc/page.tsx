"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Upload,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { useGetMyKycQuery, useSubmitKycMutation } from "@/redux/api/kycApi";
import { ROLES, KYC_DOCUMENT_TYPES, KYC_STATUS, KycDocumentType } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { IKycDocument } from "@/types";

export default function CustomerKycPage() {
  const { data, isLoading } = useGetMyKycQuery();
  const [submitKycMutation, { isLoading: isSubmitting }] = useSubmitKycMutation();

  const isVerified = data?.isVerified || false;
  const kycDocuments: IKycDocument[] = data?.kycDocuments || [];

  const [docType, setDocType] = useState<KycDocumentType>(
    KYC_DOCUMENT_TYPES.NATIONAL_ID
  );
  const [docNumber, setDocNumber] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<IKycDocument | null>(null);

  // On file select: show local preview, then upload to Cloudinary
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB.");
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setLocalPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload directly to Cloudinary via the server-side API
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kyc-documents");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || "Upload failed.");
      }

      setDocUrl(uploadData.url);
      toast.success("Document uploaded to secure cloud storage.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload document.";
      toast.error(msg);
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) {
      toast.error("Please enter your document identification number.");
      return;
    }
    if (!docUrl) {
      toast.error("Please select a document scan image or PDF.");
      return;
    }

    try {
      const res = await submitKycMutation({
        docType,
        docNumber: docNumber.trim(),
        docUrl,
      }).unwrap();

      toast.success(res.message);
      setDocNumber("");
      setDocUrl("");
      setLocalPreview(null);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to submit KYC document.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Identity Verification & Digital KYC
            </h1>
            <Badge variant={isVerified ? "success" : "warning"} dot>
              {isVerified ? "Tier 2 Verified" : "Verification Pending"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compliant with FATF & Central Banking Anti-Money Laundering regulatory standards.
          </p>
        </div>

        {/* Verification Status Card */}
        <div
          className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
            isVerified
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
              : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl ${
                isVerified ? "bg-emerald-500/20" : "bg-amber-500/20"
              }`}
            >
              {isVerified ? (
                <ShieldCheck className="h-7 w-7 text-emerald-500" />
              ) : (
                <ShieldAlert className="h-7 w-7 text-amber-500" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isVerified
                  ? "Identity Confirmed & Fully Verified"
                  : "Verification Incomplete"}
              </h3>
              <p className="text-xs opacity-90 mt-1 leading-relaxed max-w-xl">
                {isVerified
                  ? "Your government identification has been validated by compliance officers. All credit limits, high-value transfers, and virtual card issuance capabilities are fully unlocked."
                  : "Please upload your Government National ID or Passport along with a recent utility bill to verify your identity and remove daily clearance limits."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Document Submission Form */}
          <div className="lg:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-indigo-500" />
                  Submit Identity Document
                </CardTitle>
                <CardDescription>
                  Upload clear, high-resolution scans of your official documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Select
                    label="Document Category"
                    value={docType}
                    onChange={(e) =>
                      setDocType(e.target.value as KycDocumentType)
                    }
                    options={[
                      {
                        value: KYC_DOCUMENT_TYPES.NATIONAL_ID,
                        label: "National Smart Identity Card (NID)",
                      },
                      {
                        value: KYC_DOCUMENT_TYPES.PASSPORT,
                        label: "International Passport",
                      },
                      {
                        value: KYC_DOCUMENT_TYPES.DRIVING_LICENSE,
                        label: "Driving License",
                      },
                      {
                        value: KYC_DOCUMENT_TYPES.UTILITY_BILL,
                        label: "Utility Bill (Proof of Address)",
                      },
                    ]}
                  />

                  <Input
                    label="Document Identification Number"
                    placeholder="e.g. NID 8291048192 or Passport A1928374"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Document Scan / Photo
                    </label>
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                      isUploading
                        ? "border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-indigo-500/50"
                    }`}>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="kyc-file-input"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="kyc-file-input"
                        className={`flex flex-col items-center gap-2 ${isUploading ? "cursor-wait" : "cursor-pointer"}`}
                      >
                        {isUploading ? (
                          <>
                            <Upload className="h-7 w-7 text-indigo-400 animate-bounce" />
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              Uploading to Cloudinary…
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Please wait while your file is securely uploaded.
                            </span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-7 w-7 text-slate-400" />
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              {docUrl ? "Change selected file" : "Upload document file"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              PNG, JPG, or PDF up to 10MB — stored securely in Cloudinary
                            </span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Local preview while uploading */}
                    {localPreview && !docUrl && isUploading && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-indigo-300 dark:border-indigo-800 max-h-32">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={localPreview}
                          alt="Preview"
                          className="w-full object-cover max-h-32"
                        />
                      </div>
                    )}

                    {docUrl && (
                      <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                            Uploaded to Cloudinary
                          </span>
                          {docUrl.startsWith("https://res.cloudinary.com") && (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-500 hover:underline flex items-center gap-0.5"
                            >
                              <Eye className="h-3 w-3" /> View
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => { setDocUrl(""); setLocalPreview(null); }}
                          className="text-slate-400 hover:text-rose-500 text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="sm"
                    isLoading={isSubmitting || isUploading}
                    disabled={!docUrl || isUploading}
                  >
                    {isUploading ? "Uploading Document…" : "Submit for Compliance Review"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Submitted Documents History Table */}
          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle>Submitted Document Records</CardTitle>
                <CardDescription>
                  Audit history of all submitted identification credentials and verification decisions.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Loading records...
                  </div>
                ) : kycDocuments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No documents submitted yet. Use the form on the left to submit your NID or Passport.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kycDocuments.map((doc, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-xs">
                            {doc.docType.replace("_", " ")}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">
                            {doc.docNumber}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {formatDate(doc.submittedAt)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                doc.status === KYC_STATUS.APPROVED
                                  ? "success"
                                  : doc.status === KYC_STATUS.REJECTED
                                  ? "danger"
                                  : "warning"
                              }
                              size="sm"
                              dot
                            >
                              {doc.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPreviewDoc(doc)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal: Document Preview */}
        <Modal
          isOpen={!!selectedPreviewDoc}
          onClose={() => setSelectedPreviewDoc(null)}
          title={`Document: ${selectedPreviewDoc?.docType.replace("_", " ") || ""}`}
          description={`ID: ${selectedPreviewDoc?.docNumber || ""} • Status: ${selectedPreviewDoc?.status || ""}`}
        >
          {selectedPreviewDoc && (
            <div className="space-y-4 pt-2">
              <div className="max-h-96 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 bg-slate-950">
                {(selectedPreviewDoc.docUrl.startsWith("data:image") ||
                  selectedPreviewDoc.docUrl.startsWith("https://res.cloudinary.com")) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedPreviewDoc.docUrl}
                    alt="KYC Document Preview"
                    className="max-h-80 object-contain rounded-lg"
                  />
                ) : selectedPreviewDoc.docUrl.startsWith("https://") ? (
                  <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                    <FileText className="h-10 w-10 mx-auto text-indigo-400" />
                    <p>PDF Document stored in cloud storage</p>
                    <a
                      href={selectedPreviewDoc.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Eye className="h-3.5 w-3.5" /> Open Document
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-indigo-400" />
                    Document file attached (PDF / Encrypted Document)
                  </div>
                )}
              </div>

              {selectedPreviewDoc.remarks && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Compliance Officer Remarks:
                  </p>
                  <p className="text-slate-500 mt-0.5">{selectedPreviewDoc.remarks}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
