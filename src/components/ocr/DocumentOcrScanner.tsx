"use client";

import React, { useState, useRef } from "react";
import {
  Scan,
  Upload,
  CheckCircle2,
  Sparkles,
  FileText,
  CreditCard,
  Globe,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SAMPLE_DOCUMENTS } from "@/lib/ocr-samples";

export interface ExtractedOcrData {
  fullName: string;
  docNumber: string;
  dateOfBirth: string;
  gender: string;
  fatherName?: string;
  motherName?: string;
  address?: string;
  expiryDate?: string;
  nationality?: string;
  taxId?: string;
  confidence: number;
}

interface DocumentOcrScannerProps {
  onApplyData: (data: ExtractedOcrData, docFrontUrl: string) => void;
}

export function DocumentOcrScanner({ onApplyData }: DocumentOcrScannerProps) {
  const [docType, setDocType] = useState<"NATIONAL_ID" | "PASSPORT" | "DRIVING_LICENSE">("NATIONAL_ID");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState("");
  const [extractedResult, setExtractedResult] = useState<ExtractedOcrData | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trigger OCR scan on backend
  const runOcrProcess = async (
    imageDataUrl: string | null,
    presetKey: string | null = null
  ) => {
    setIsScanning(true);
    setScanProgress(15);
    setScanStepText("Calibrating optical character recognition engine...");
    setExtractedResult(null);

    // Progress animation simulation while server recognizes
    const progressTimer = setInterval(() => {
      setScanProgress((prev) => {
        if (prev < 40) {
          setScanStepText("Enhancing document contrast & boundary detection...");
          return prev + 12;
        }
        if (prev < 75) {
          setScanStepText("Extracting alphanumeric glyphs & visual zones...");
          return prev + 8;
        }
        if (prev < 90) {
          setScanStepText("Parsing KYC identity entities (Name, ID, DOB, Address)...");
          return prev + 4;
        }
        return prev;
      });
    }, 280);

    try {
      const res = await fetch("/api/ocr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageDataUrl,
          docTypeHint: docType,
          preset: presetKey,
        }),
      });

      clearInterval(progressTimer);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "OCR scan failed.");
      }

      setScanProgress(100);
      setScanStepText("Verification completed successfully!");

      const data: ExtractedOcrData = {
        fullName: json.extracted?.fullName || "",
        docNumber: json.extracted?.docNumber || "",
        dateOfBirth: json.extracted?.dateOfBirth || "",
        gender: json.extracted?.gender || "",
        fatherName: json.extracted?.fatherName || "",
        motherName: json.extracted?.motherName || "",
        address: json.extracted?.address || "",
        expiryDate: json.extracted?.expiryDate || "",
        nationality: json.extracted?.nationality || "",
        taxId: json.extracted?.taxId || "",
        confidence: json.confidence || 95,
      };

      if (json.imagePreview && !imageDataUrl) {
        setPreviewImage(json.imagePreview);
      }

      setExtractedResult(data);
      toast.success(
        `OCR Extracted: ${data.fullName || "Document"} (${data.confidence.toFixed(1)}% Confidence)`
      );
    } catch (err: unknown) {
      clearInterval(progressTimer);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to parse document via OCR";
      toast.error(errorMsg);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle preset sample card selection
  const handleSelectPreset = (presetKey: keyof typeof SAMPLE_DOCUMENTS) => {
    setActivePreset(presetKey);
    const sample = SAMPLE_DOCUMENTS[presetKey];
    setDocType(sample.docType as "NATIONAL_ID" | "PASSPORT" | "DRIVING_LICENSE");
    setPreviewImage(sample.imagePreview);
    runOcrProcess(null, presetKey);
  };

  // Handle user file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, JPEG, WebP)");
      return;
    }

    setActivePreset(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewImage(dataUrl);
      runOcrProcess(dataUrl, null);
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!extractedResult) return;
    onApplyData(extractedResult, previewImage || "");
    toast.success("Extracted KYC data applied to Account Opening Form!");
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Scan className="h-4 w-4" />
            </span>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Smart Identity Document OCR Scanner
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Extract legal name, national ID/passport number, DOB, and address instantly using optical vision.
          </p>
        </div>

        {/* Document Type Selector */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
          <button
            type="button"
            onClick={() => setDocType("NATIONAL_ID")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              docType === "NATIONAL_ID"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            National ID
          </button>
          <button
            type="button"
            onClick={() => setDocType("PASSPORT")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              docType === "PASSPORT"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Passport
          </button>
          <button
            type="button"
            onClick={() => setDocType("DRIVING_LICENSE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              docType === "DRIVING_LICENSE"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Driver License
          </button>
        </div>
      </div>

      {/* 1-Click Preset Demo Strip */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            1-Click Sample KYC Document Presets (Instant OCR Demo):
          </span>
          <span className="text-[10px] text-slate-400">Click any card to auto-scan</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelectPreset("SAMPLE_NID")}
            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
              activePreset === "SAMPLE_NID"
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
                : "border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-xs font-semibold truncate">Bangladesh Smart NID</div>
              <div className="text-[10px] text-slate-400 truncate">Arif Hasan (1995269...)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset("SAMPLE_PASSPORT")}
            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
              activePreset === "SAMPLE_PASSPORT"
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200"
                : "border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-xs font-semibold truncate">Biometric US Passport</div>
              <div className="text-[10px] text-slate-400 truncate">Nusrat Sultana (A2938...)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset("SAMPLE_DRIVING_LICENSE")}
            className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
              activePreset === "SAMPLE_DRIVING_LICENSE"
                ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200"
                : "border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-xs font-semibold truncate">State Driver License</div>
              <div className="text-[10px] text-slate-400 truncate">Tanvir Rahman (DL-849...)</div>
            </div>
          </button>
        </div>
      </div>

      {/* Live OCR Scanner Canvas / Preview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-6 space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center min-h-[220px] rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/60 p-4 text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/20 transition-all overflow-hidden"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {previewImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage}
                  alt="Scanned KYC Document"
                  className="max-h-[210px] w-auto rounded-lg object-contain shadow-md"
                />

                {/* Laser Scan Beam Animation */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse transition-all duration-700 transform translate-y-24" />
                    <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[0.5px]" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 group-hover:text-cyan-500 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-950/80">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Drag & Drop Document or Click to Upload
                </div>
                <div className="text-[11px] text-slate-400">
                  Supports High-Res PNG, JPG, or WebP Document Photos
                </div>
              </div>
            )}

            {previewImage && !isScanning && (
              <div className="absolute bottom-2 right-2 flex gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="h-7 text-xs bg-black/60 text-white backdrop-blur-xs border-0 hover:bg-black/80"
                  leftIcon={<RefreshCw className="h-3 w-3" />}
                >
                  Replace Image
                </Button>
              </div>
            )}
          </div>

          {/* Real-Time OCR Scan Progress Bar */}
          {isScanning && (
            <div className="space-y-1.5 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <div className="flex items-center justify-between text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {scanStepText}
                </span>
                <span>{scanProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Extracted Fields Live Inspection Box */}
        <div className="md:col-span-6 flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                OCR Parsed Entity Verification
              </div>
              {extractedResult && (
                <Badge variant="success" className="text-[10px] font-mono">
                  {extractedResult.confidence.toFixed(1)}% Confidence
                </Badge>
              )}
            </div>

            {extractedResult ? (
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Full Legal Name
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {extractedResult.fullName || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Document Number
                    </span>
                    <p className="font-mono font-semibold text-cyan-600 dark:text-cyan-400 truncate">
                      {extractedResult.docNumber || "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Date of Birth
                    </span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {extractedResult.dateOfBirth || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Gender
                    </span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {extractedResult.gender || "—"}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Residential Address
                  </span>
                  <p className="font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                    {extractedResult.address || "Sector 4, Uttara, Dhaka 1230"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400 space-y-1">
                <Scan className="h-8 w-8 stroke-1 text-slate-300 dark:text-slate-600 mb-1" />
                <p className="text-xs">No document scanned yet</p>
                <p className="text-[11px] text-slate-500">
                  Upload an ID photo or select one of the instant sample presets above.
                </p>
              </div>
            )}
          </div>

          {/* Auto-Fill Action */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 mt-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!extractedResult || isScanning}
              onClick={handleApply}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
              leftIcon={<Zap className="h-3.5 w-3.5 fill-current" />}
            >
              Auto-Fill Account Opening Form with OCR
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
