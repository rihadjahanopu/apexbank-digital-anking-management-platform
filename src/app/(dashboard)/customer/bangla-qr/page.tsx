"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  QrCode,
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Copy,
  Download,
  Store,
  Sparkles,
  MapPin,
  Receipt,
  Lock,
} from "lucide-react";
import { downloadReceiptPDF } from "@/lib/pdf-receipt";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Input,
  Select,
} from "@/components/ui";
import { useGetMyAccountsQuery } from "@/redux/api/accountsApi";
import { usePayBanglaQRMutation } from "@/redux/api/transactionsApi";
import { ROLES, ACCOUNT_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { maskAccountNumber } from "@/lib/utils";
import {
  decodeBanglaQR,
  encodeBanglaQR,
  BanglaQRPayload,
  SAMPLE_BANGLA_QRS,
} from "@/lib/bangla-qr";

interface PaymentReceiptData {
  transactionId: string;
  amount: number;
  merchantName: string;
  merchantCity: string;
  category: string;
  timestamp: string;
  sourceAccountNumber: string;
  newBalance: number;
}

export default function BanglaQRPage() {
  const { data: accountsData } = useGetMyAccountsQuery();
  const [payBanglaQRMutation, { isLoading: isPaying }] = usePayBanglaQRMutation();

  const accounts = useMemo(
    () => (accountsData?.accounts || []).filter((a) => a.status === ACCOUNT_STATUS.ACTIVE),
    [accountsData?.accounts]
  );

  // Active view: "scan" | "generate"
  const [activeTab, setActiveTab] = useState<"scan" | "generate">("scan");

  // Camera & Scanner State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const scanLoopRef = useRef<number | null>(null);
  const scanFrameRef = useRef<() => void>(() => {});

  // Scanned Payload & Payment Form State
  const [scannedPayload, setScannedPayload] = useState<BanglaQRPayload | null>(null);
  const [rawScannedString, setRawScannedString] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [userSelectedAccountId, setUserSelectedAccountId] = useState<string>("");
  const [transactionPin, setTransactionPin] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");

  // Determine active account ID (fallback to first active account)
  const selectedAccountId = userSelectedAccountId || (accounts.length > 0 ? accounts[0]._id : "");

  // Payment Success Receipt State
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null);

  // QR Generator State
  const [generatorMode, setGeneratorMode] = useState<"static" | "dynamic">("static");
  const [genAmount, setGenAmount] = useState<string>("");
  const [genBillNumber, setGenBillNumber] = useState<string>("");
  const [genPurpose, setGenPurpose] = useState<string>("");
  const [generatedQRUrl, setGeneratedQRUrl] = useState<string>("");

  // Decode scanned QR and pre-fill form
  const handleScannedResult = useCallback((codeString: string) => {
    const decoded = decodeBanglaQR(codeString);
    setRawScannedString(codeString);
    setScannedPayload(decoded);

    if (decoded.isValid) {
      toast.success(`Bangla QR Detected: ${decoded.merchantName}`);
      if (decoded.amount && decoded.amount > 0) {
        setPaymentAmount(decoded.amount.toString());
      } else {
        setPaymentAmount("");
      }
    } else {
      toast.error("Scanned QR code is not a valid Bangla QR format.");
    }
  }, []);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Frame scanning loop via Canvas & jsQR
  const scanFrame = useCallback(() => {
    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          handleScannedResult(code.data);
          stopCamera();
          return;
        }
      }
    }

    scanLoopRef.current = requestAnimationFrame(() => {
      scanFrameRef.current();
    });
  }, [handleScannedResult, stopCamera]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        scanLoopRef.current = requestAnimationFrame(() => {
          scanFrameRef.current();
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      setCameraError(error.message || "Failed to access camera device.");
      setIsCameraActive(false);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle Image Upload / Gallery File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleScannedResult(code.data);
        } else {
          toast.error("Could not find a valid QR code in the uploaded image. Please try another.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Load Sample Bangladeshi Merchant QR Preset
  const loadPreset = (preset: (typeof SAMPLE_BANGLA_QRS)[0]) => {
    stopCamera();
    const encoded = encodeBanglaQR({
      pointOfInitiation: preset.pointOfInitiation,
      merchantId: preset.merchantId,
      merchantName: preset.name,
      merchantCity: preset.city,
      mcc: preset.mcc,
      amount: preset.amount,
      billNumber: preset.billNumber,
    });
    handleScannedResult(encoded);
  };

  // Execute Bangla QR Payment
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccountId) {
      toast.error("Please select a bank account to pay from.");
      return;
    }

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    if (!transactionPin || transactionPin.length !== 4) {
      toast.error("Please enter your 4-digit transaction PIN.");
      return;
    }

    try {
      const res = await payBanglaQRMutation({
        senderAccountId: selectedAccountId,
        qrRawString: rawScannedString,
        amount: amt,
        transactionPin,
        note: paymentNote,
      }).unwrap();

      if (res.success && res.data) {
        toast.success(res.message || "Payment successful!");
        setReceiptData(res.data as PaymentReceiptData);
        setTransactionPin("");
        setScannedPayload(null);
        setRawScannedString("");
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Bangla QR payment failed.");
    }
  };

  // PDF Receipt Download for Bangla QR Payment
  const handleDownloadQRReceipt = async (data: PaymentReceiptData) => {
    try {
      await downloadReceiptPDF(
        {
          kind: "bangla-qr",
          transactionId: data.transactionId,
          merchantName: data.merchantName,
          merchantCity: data.merchantCity,
          category: data.category,
          amount: data.amount,
          sourceAccountNumber: data.sourceAccountNumber,
          timestamp: data.timestamp,
        },
        `BanglaQR_Receipt_${data.transactionId}.pdf`
      );
      toast.success("PDF রসিদ ডাউনলোড হয়েছে!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("PDF রসিদ তৈরি করতে সমস্যা হয়েছে।");
    }
  };

  // Generate My Bangla QR Code String
  const genRawString = useMemo(() => {
    if (accounts.length === 0) return "";
    const primaryAcc = accounts[0];
    const amtNum = parseFloat(genAmount);

    return encodeBanglaQR({
      pointOfInitiation: generatorMode === "dynamic" && !isNaN(amtNum) && amtNum > 0 ? "12" : "11",
      merchantId: primaryAcc.accountNumber,
      merchantName: `${primaryAcc.accountType} ACCOUNT`,
      merchantCity: "DHAKA",
      mcc: "6012",
      amount: generatorMode === "dynamic" && !isNaN(amtNum) && amtNum > 0 ? amtNum : undefined,
      billNumber: genBillNumber || undefined,
      purpose: genPurpose || undefined,
    });
  }, [accounts, generatorMode, genAmount, genBillNumber, genPurpose]);

  // Convert raw string to DataURL
  useEffect(() => {
    if (activeTab === "generate" && genRawString) {
      QRCode.toDataURL(genRawString, {
        width: 320,
        margin: 2,
        color: {
          dark: "#022c22",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      })
        .then((url) => setGeneratedQRUrl(url))
        .catch(() => {});
    }
  }, [activeTab, genRawString]);

  const selectedAccount = accounts.find((a) => a._id === selectedAccountId);

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <QrCode className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Bangla QR Payment Hub
              </h1>
              <Badge variant="success" dot>
                BB NPSB Interoperable
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Bangladesh Bank standard cashless retail payments, merchant checkout, and P2P transfers.
            </p>
          </div>

          {/* Navigation View Switcher */}
          <div className="w-full sm:w-auto inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 justify-center">
            <button
              onClick={() => {
                setActiveTab("scan");
                setReceiptData(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "scan"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>Scan & Pay</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("generate");
                stopCamera();
                setReceiptData(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "generate"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>My Bangla QR</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: SCAN & PAY */}
        {activeTab === "scan" && !receiptData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Scanner Column */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="p-6 border-slate-200 dark:border-slate-800 text-center relative overflow-hidden">
                <div className="max-w-xs mx-auto">
                  {/* Camera Video View */}
                  {isCameraActive ? (
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/50 shadow-inner">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Animated Targeting Overlay */}
                      <div className="absolute inset-0 border-2 border-emerald-400/40 pointer-events-none flex items-center justify-center">
                        <div className="w-56 h-56 border-2 border-dashed border-emerald-400 rounded-2xl relative">
                          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400" />
                          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400" />
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400" />
                          <div className="absolute left-0 right-0 h-1 bg-linear-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400 animate-bounce" />
                        </div>
                      </div>

                      {/* Controls inside camera */}
                      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
                            stopCamera();
                            setTimeout(startCamera, 200);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-black/60 text-white text-xs font-mono backdrop-blur-md border border-white/20 flex items-center gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Flip Cam</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/80 text-white text-xs font-mono backdrop-blur-md"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Inactive Camera Placeholder */
                    <div className="aspect-square w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center p-6 space-y-4">
                      <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                        <Camera className="h-8 w-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Live QR Scanner
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Scan any merchant counter Bangla QR code using your device camera.
                        </p>
                      </div>
                      <Button
                        onClick={startCamera}
                        variant="primary"
                        size="sm"
                        leftIcon={<Camera className="h-4 w-4" />}
                      >
                        Start Camera Scan
                      </Button>
                    </div>
                  )}

                  {cameraError && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {/* Upload QR Image from Gallery */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
                    <label className="cursor-pointer flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                      <Upload className="h-4 w-4" />
                      <span>Or Upload QR Image from Gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              </Card>

              {/* Realistic Bangladeshi Merchant Simulator Presets */}
              <div className="glass-forest-card rounded-2xl p-5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                    <Sparkles className="h-3.5 w-3.5" />
                    Instant Demo Merchant Presets
                  </span>
                  <span className="text-[10px] text-slate-400">1-Click Test</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SAMPLE_BANGLA_QRS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => loadPreset(preset)}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-emerald-500/20 hover:border-emerald-400/50 hover:bg-emerald-950/40 text-left transition-all group"
                    >
                      <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide">
                        {preset.logoText}
                      </div>
                      <div className="text-xs font-semibold text-white truncate mt-0.5 group-hover:text-emerald-300">
                        {preset.name.split(" ")[0]}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        {preset.amount ? `৳${preset.amount.toFixed(0)}` : "Open Amt"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Review & Payment Confirmation Column */}
            <div className="lg:col-span-6 space-y-6">
              {scannedPayload ? (
                <Card className="p-6 border-emerald-500/30 shadow-lg">
                  <CardHeader className="p-0 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {scannedPayload.merchantName}
                          </CardTitle>
                          <CardDescription className="text-xs flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {scannedPayload.merchantCity} • {scannedPayload.mccCategory}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">
                        Verified
                      </Badge>
                    </div>
                  </CardHeader>

                  <form onSubmit={handleConfirmPayment} className="pt-5 space-y-4">
                    {/* Merchant Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400">Merchant ID:</span>
                        <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {scannedPayload.merchantId}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400">QR Mode:</span>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {scannedPayload.pointOfInitiation === "12" ? "Dynamic (Fixed Amount)" : "Static (Open Amount)"}
                        </div>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-500 mb-1">
                        Payable Amount (BDT ৳)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          ৳
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          placeholder="0.00"
                          value={paymentAmount}
                          readOnly={scannedPayload.pointOfInitiation === "12" && scannedPayload.amount !== null}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className={`w-full rounded-xl pl-8 pr-4 py-3 text-2xl font-bold font-mono outline-hidden border transition-colors ${
                            scannedPayload.pointOfInitiation === "12"
                              ? "bg-slate-100 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-800 cursor-not-allowed"
                              : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          }`}
                          required
                        />
                      </div>
                    </div>

                    {/* Source Bank Account */}
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-500 mb-1">
                        Debit Source Account
                      </label>
                      <Select
                        value={selectedAccountId}
                        onChange={(e) => setUserSelectedAccountId(e.target.value)}
                        required
                      >
                        {accounts.map((acc) => (
                          <option key={acc._id} value={acc._id}>
                            {acc.accountType} ({maskAccountNumber(acc.accountNumber)}) — Bal: {formatCurrency(acc.availableBalance)}
                          </option>
                        ))}
                      </Select>
                      {selectedAccount && (
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-1 px-1">
                          <span>Available: {formatCurrency(selectedAccount.availableBalance)}</span>
                          <span>Fee: ৳0.00 (Free)</span>
                        </div>
                      )}
                    </div>

                    {/* Payment Note */}
                    <Input
                      label="Payment Reference / Note (Optional)"
                      placeholder="e.g. Grocery purchase, Dinner bill"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />

                    {/* 4-Digit Transaction PIN */}
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-500 mb-1">
                        4-Digit Transaction PIN
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="••••"
                          value={transactionPin}
                          onChange={(e) => setTransactionPin(e.target.value.replace(/\D/g, ""))}
                          className="w-full text-center font-mono text-xl tracking-[0.4em] font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 outline-hidden focus:border-emerald-500"
                          required
                        />
                        <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        className="flex-1"
                        onClick={() => {
                          setScannedPayload(null);
                          setRawScannedString("");
                          setPaymentAmount("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="flex-2"
                        isLoading={isPaying}
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        Authorize Payment
                      </Button>
                    </div>
                  </form>
                </Card>
              ) : (
                /* Empty state when no QR scanned yet */
                <Card className="p-8 border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Receipt className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Awaiting Scanned Code
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Scan a live Bangla QR merchant code using your camera or click any of the instant demo presets on the left.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-3 text-xs text-slate-400 font-mono">
                    <span>✓ Interoperable NPSB</span>
                    <span>✓ Zero Transaction Fee</span>
                    <span>✓ Atomic Settlement</span>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* PAYMENT SUCCESS RECEIPT MODAL */}
        {receiptData && (
          <div className="max-w-md mx-auto">
            <Card className="p-6 border-emerald-500/40 shadow-2xl text-center space-y-5">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-400/40">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>

              <div>
                <Badge variant="success" size="sm">
                  Bangla QR Payment Successful
                </Badge>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-2">
                  ৳{receiptData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-500 mt-1">Paid to {receiptData.merchantName}</p>
              </div>

              {/* Transaction Receipt Details */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs border-y border-slate-100 dark:border-slate-800 py-2 text-left">
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {receiptData.transactionId}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Merchant Location:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {receiptData.merchantCity}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Merchant Category:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {receiptData.category}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Debited Account:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {maskAccountNumber(receiptData.sourceAccountNumber)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    {new Date(receiptData.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => handleDownloadQRReceipt(receiptData)}
                >
                  Download PDF Receipt
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    className="flex-1"
                    onClick={() => {
                      setReceiptData(null);
                      setScannedPayload(null);
                    }}
                  >
                    Make Another Payment
                  </Button>
                  <Link href="/customer/transactions" className="flex-1">
                    <Button variant="primary" size="md" className="w-full">
                      View Statement
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* VIEW 2: MY BANGLA QR CODE GENERATOR */}
        {activeTab === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left QR Code Display & Frame */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="p-6 rounded-3xl bg-white text-slate-950 border-4 border-emerald-600 shadow-2xl flex flex-col items-center max-w-sm w-full text-center relative">
                {/* Official Bangla QR Header Badge */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 w-full justify-center">
                  <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    বা
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 leading-none">
                      বাংলা কিউআর • BANGLA QR
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      BANGLADESH BANK INTEROPERABLE
                    </div>
                  </div>
                </div>

                {/* The QR Code Canvas */}
                {generatedQRUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={generatedQRUrl}
                    alt="My Bangla QR Code"
                    className="w-64 h-64 rounded-xl shadow-xs"
                  />
                ) : (
                  <div className="w-64 h-64 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    Generating...
                  </div>
                )}

                {/* Account Details Footer */}
                <div className="mt-3 text-center">
                  <div className="text-xs font-bold text-slate-900 uppercase">
                    {accounts[0] ? `${accounts[0].accountType} ACCOUNT` : "APEX BANK ACCOUNT"}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                    A/C: {maskAccountNumber(accounts[0]?.accountNumber || "88290192")}
                  </div>
                  {generatorMode === "dynamic" && parseFloat(genAmount) > 0 && (
                    <div className="mt-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-sm inline-block">
                      ৳{parseFloat(genAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </div>

              {/* Download / Share Actions */}
              <div className="mt-4 flex items-center gap-3">
                <a
                  href={generatedQRUrl}
                  download={`BanglaQR-${accounts[0]?.accountNumber || "Apex"}.png`}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Download QR Image
                  </Button>
                </a>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Copy className="h-4 w-4" />}
                  onClick={() => {
                    navigator.clipboard.writeText(genRawString);
                    toast.success("Bangla QR EMVCo payload copied to clipboard!");
                  }}
                >
                  Copy Payload
                </Button>
              </div>
            </div>

            {/* Right Configuration Form */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base">Configure Your Bangla QR</CardTitle>
                  <CardDescription>
                    Accept payments from any Bangladeshi bank or MFS app (Citytouch, Astha, bKash, Nagad).
                  </CardDescription>
                </CardHeader>

                <div className="space-y-5 pt-2">
                  {/* Mode Selector */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-500 mb-2">
                      QR Specification Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setGeneratorMode("static");
                          setGenAmount("");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          generatorMode === "static"
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div className="text-xs font-bold">Static QR (স্থায়ী কিউআর)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Payer enters amount on their phone
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGeneratorMode("dynamic")}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          generatorMode === "dynamic"
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div className="text-xs font-bold">Dynamic QR (নির্দিষ্ট টাকা)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Exact BDT amount pre-encoded in QR
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Mode Inputs */}
                  {generatorMode === "dynamic" && (
                    <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                      <div>
                        <label className="block text-xs font-mono uppercase text-slate-500 mb-1">
                          Exact Amount to Collect (BDT ৳)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 500"
                          value={genAmount}
                          onChange={(e) => setGenAmount(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Bill / Invoice Number (Optional)"
                          placeholder="e.g. INV-901"
                          value={genBillNumber}
                          onChange={(e) => setGenBillNumber(e.target.value)}
                        />
                        <Input
                          label="Purpose / Item (Optional)"
                          placeholder="e.g. Consultation fee"
                          value={genPurpose}
                          onChange={(e) => setGenPurpose(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Compliance Information */}
                  <div className="rounded-xl p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>Compliant with Bangladesh Bank National QR Mandate</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Prints generated from this code can be displayed at your cash counter or shared digitally for direct settlement into your ApexBank depository balance.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
