"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Download,
  Lock,
  RotateCcw,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  Badge,
  Button,
  Select,
} from "@/components/ui";
import { useGetMyAccountsQuery } from "@/redux/api/accountsApi";
import { useRechargeMobileMutation } from "@/redux/api/transactionsApi";
import { ROLES, ACCOUNT_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { maskAccountNumber } from "@/lib/utils";
import {
  BANGLADESH_OPERATORS,
  detectOperator,
  validateBDPhoneNumber,
  RECHARGE_QUICK_AMOUNTS,
  POPULAR_RECHARGE_PACKS,
  MobileOperatorId,
  ConnectionType,
  RechargePack,
} from "@/lib/mobile-recharge";
import { downloadReceiptPDF } from "@/lib/pdf-receipt";

interface RechargeReceipt {
  transactionId: string;
  mobileNumber: string;
  operatorName: string;
  bengaliOperatorName: string;
  connectionType: ConnectionType;
  amount: number;
  packTitle: string;
  timestamp: string;
  sourceAccountNumber: string;
  newBalance: number;
}

export default function MobileRechargePage() {
  const { data: accountsData } = useGetMyAccountsQuery();
  const [rechargeMutation, { isLoading: isRecharging }] = useRechargeMobileMutation();

  const accounts = useMemo(
    () => (accountsData?.accounts || []).filter((a) => a.status === ACCOUNT_STATUS.ACTIVE),
    [accountsData?.accounts]
  );

  // Form State
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<MobileOperatorId>("GP");
  const [connectionType, setConnectionType] = useState<ConnectionType>("PREPAID");
  const [amount, setAmount] = useState<string>("");
  const [selectedPack, setSelectedPack] = useState<RechargePack | null>(null);
  const [userSelectedAccountId, setUserSelectedAccountId] = useState<string>("");
  const [transactionPin, setTransactionPin] = useState<string>("");

  // Determine active account ID (fallback to first active account)
  const selectedAccountId = userSelectedAccountId || (accounts.length > 0 ? accounts[0]._id : "");

  // Tab for packages: "airtime" | "internet" | "minute" | "combo"
  const [packCategory, setPackCategory] = useState<"airtime" | "internet" | "minute" | "combo">("airtime");

  // Success Receipt State
  const [receiptData, setReceiptData] = useState<RechargeReceipt | null>(null);

  // Auto-detect operator as user types phone number
  const handlePhoneChange = (val: string) => {
    setMobileNumber(val);
    const detected = detectOperator(val);
    if (detected) {
      setSelectedOperator(detected);
    }
  };

  // Select pack handler
  const handleSelectPack = (pack: RechargePack) => {
    setSelectedPack(pack);
    setAmount(pack.price.toString());
    setSelectedOperator(pack.operatorId);
  };

  // Submit Recharge
  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateBDPhoneNumber(mobileNumber);
    if (!validation.isValid) {
      toast.error(validation.error || "Please enter a valid 11-digit Bangladeshi mobile number.");
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum < 10 || amtNum > 5000) {
      toast.error("Recharge amount must be between ৳10 and ৳5,000.");
      return;
    }

    if (!selectedAccountId) {
      toast.error("Please select a bank account to debit.");
      return;
    }

    if (!transactionPin || transactionPin.length !== 4) {
      toast.error("Please enter your 4-digit transaction PIN.");
      return;
    }

    try {
      const res = await rechargeMutation({
        senderAccountId: selectedAccountId,
        mobileNumber: validation.normalized,
        operatorId: selectedOperator,
        connectionType,
        amount: amtNum,
        packTitle: selectedPack?.title,
        transactionPin,
      }).unwrap();

      if (res.success && res.data) {
        toast.success(res.message || "Mobile recharge successful!");
        setReceiptData(res.data as RechargeReceipt);
        setTransactionPin("");
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Mobile recharge request failed.");
    }
  };

  // PDF Receipt Download for Mobile Recharge
  const handleDownloadRechargeReceipt = async (data: RechargeReceipt) => {
    try {
      await downloadReceiptPDF(
        {
          kind: "recharge",
          transactionId: data.transactionId,
          mobileNumber: data.mobileNumber,
          operatorName: data.operatorName,
          bengaliOperatorName: data.bengaliOperatorName,
          connectionType: data.connectionType,
          amount: data.amount,
          packTitle: data.packTitle,
          sourceAccountNumber: data.sourceAccountNumber,
          timestamp: data.timestamp,
          newBalance: data.newBalance,
        },
        `Recharge_Receipt_${data.transactionId}.pdf`
      );
      toast.success("PDF রসিদ ডাউনলোড হয়েছে!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("PDF রসিদ তৈরি করতে সমস্যা হয়েছে।");
    }
  };

  const activeOp = BANGLADESH_OPERATORS[selectedOperator];
  const selectedAccount = accounts.find((a) => a._id === selectedAccountId);

  // Filter packs for active operator and selected category
  const filteredPacks = POPULAR_RECHARGE_PACKS.filter((p) => {
    if (p.operatorId !== selectedOperator) return false;
    if (packCategory === "airtime") return true;
    return p.category === packCategory;
  });

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold">
                <Smartphone className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Mobile Recharge Desk (মোবাইল রিচার্জ)
              </h1>
              <Badge variant="info">Instant Telecom Settlement</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Top up airtime balance, internet data bundles, and minute packs across all Bangladeshi telecom operators.
            </p>
          </div>

          <Link href="/customer/transactions">
            <Button variant="outline" size="sm" leftIcon={<History className="h-4 w-4" />}>
              Recharge History
            </Button>
          </Link>
        </div>

        {/* RECHARGE FORM & PACKS GRID */}
        {!receiptData ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Number, Operator, and Amount Form */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-md">
                <form onSubmit={handleRechargeSubmit} className="space-y-5">
                  {/* Mobile Number Input with Auto-detection Indicator */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-500 mb-1">
                      Recipient Mobile Number (বাংলাদেশী নম্বর)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-slate-400">
                        +88
                      </span>
                      <input
                        type="tel"
                        maxLength={11}
                        placeholder="017XXXXXXXX"
                        value={mobileNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full rounded-xl pl-12 pr-28 py-3 text-lg font-bold font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-hidden focus:border-emerald-500 transition-colors"
                        required
                      />

                      {/* Detected Operator Pill on right of input */}
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <span className={`h-2.5 w-2.5 rounded-full ${activeOp.logoBg}`} />
                        <span>{activeOp.name.split(" ")[0]}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      Supports GP (017, 013), BL (019, 014), Robi (018), Airtel (016), Teletalk (015)
                    </span>
                  </div>

                  {/* Operator Manual Selector */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-500 mb-2">
                      Select Telecom Operator
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {(Object.keys(BANGLADESH_OPERATORS) as MobileOperatorId[]).map((opId) => {
                        const op = BANGLADESH_OPERATORS[opId];
                        const isSelected = selectedOperator === opId;
                        return (
                          <button
                            key={opId}
                            type="button"
                            onClick={() => {
                              setSelectedOperator(opId);
                              setSelectedPack(null);
                            }}
                            className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs"
                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                          >
                            <span className={`h-4 w-4 rounded-full ${op.logoBg} shadow-xs`} />
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                              {op.name.split(" ")[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connection Type Switcher */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-500 mb-1.5">
                      Connection Type
                    </label>
                    <div className="flex gap-2">
                      {(["PREPAID", "POSTPAID"] as ConnectionType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setConnectionType(type)}
                          className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all capitalize ${
                            connectionType === type
                              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 border-transparent shadow-xs"
                              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {type === "PREPAID" ? "Prepaid (প্রিপেইড)" : "Postpaid (পোস্টপেইড)"}
                        </button>
                      ))}
                      {activeOp.supportsSkitto && (
                        <button
                          type="button"
                          onClick={() => setConnectionType("SKITTO")}
                          className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                            connectionType === "SKITTO"
                              ? "bg-amber-400 text-slate-950 border-amber-500 shadow-xs font-bold"
                              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          Skitto (স্কিটো)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recharge Amount & Quick Pills */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-mono uppercase text-slate-500">
                        Recharge Amount (টাকা ৳)
                      </label>
                      {selectedPack && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPack(null);
                            setAmount("");
                          }}
                          className="text-[10px] text-rose-500 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Clear Bundle</span>
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ৳
                      </span>
                      <input
                        type="number"
                        min="10"
                        max="5000"
                        step="1"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setSelectedPack(null);
                        }}
                        className="w-full rounded-xl pl-8 pr-4 py-3 text-2xl font-bold font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-hidden focus:border-emerald-500"
                        required
                      />
                    </div>

                    {/* Quick Amount Pills */}
                    <div className="grid grid-cols-6 gap-1.5 mt-2">
                      {RECHARGE_QUICK_AMOUNTS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setAmount(val.toString());
                            setSelectedPack(null);
                          }}
                          className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          ৳{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Source Bank Account */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-500 mb-1">
                      Source Bank Account
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
                        <span>Operator Fee: ৳0.00 (Zero Fee)</span>
                      </div>
                    )}
                  </div>

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

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={isRecharging}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Confirm & Recharge ৳{amount || "0"}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Right Column: Operator Curated Packs & Offers */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${activeOp.logoBg}`} />
                    <span>{activeOp.name} Bundles & Packs</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select an official data or minute pack for instant telecom activation.
                  </p>
                </div>

                {/* Pack Category Filters */}
                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                  <button
                    onClick={() => setPackCategory("airtime")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      packCategory === "airtime" ? "bg-white dark:bg-slate-900 font-bold shadow-xs text-slate-900 dark:text-white" : "text-slate-500"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setPackCategory("internet")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      packCategory === "internet" ? "bg-white dark:bg-slate-900 font-bold shadow-xs text-slate-900 dark:text-white" : "text-slate-500"
                    }`}
                  >
                    Internet
                  </button>
                  <button
                    onClick={() => setPackCategory("minute")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      packCategory === "minute" ? "bg-white dark:bg-slate-900 font-bold shadow-xs text-slate-900 dark:text-white" : "text-slate-500"
                    }`}
                  >
                    Minutes
                  </button>
                  <button
                    onClick={() => setPackCategory("combo")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      packCategory === "combo" ? "bg-white dark:bg-slate-900 font-bold shadow-xs text-slate-900 dark:text-white" : "text-slate-500"
                    }`}
                  >
                    Combo
                  </button>
                </div>
              </div>

              {/* Packs List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredPacks.map((pack) => {
                  const isSelected = selectedPack?.id === pack.id;
                  return (
                    <div
                      key={pack.id}
                      onClick={() => handleSelectPack(pack)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/30"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {pack.title}
                          </span>
                          {pack.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-bold uppercase">
                              {pack.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 font-mono">
                          <span>Validity: {pack.validity}</span>
                          {pack.data && <span className="text-sky-600 font-semibold">{pack.data}</span>}
                          {pack.minutes && <span className="text-emerald-600 font-semibold">{pack.minutes}</span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                          ৳{pack.price}
                        </span>
                        <button
                          type="button"
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select Pack"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* RECHARGE SUCCESS RECEIPT MODAL */
          <div className="max-w-md mx-auto">
            <Card className="p-6 border-emerald-500/40 shadow-2xl text-center space-y-5">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-400/40">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>

              <div>
                <Badge variant="success" size="sm">
                  Mobile Recharge Completed
                </Badge>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-2">
                  ৳{receiptData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Recharged to {receiptData.operatorName} ({receiptData.mobileNumber})
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs border-y border-slate-100 dark:border-slate-800 py-2 text-left">
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {receiptData.transactionId}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Operator:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {receiptData.operatorName} ({receiptData.bengaliOperatorName})
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Connection:</span>
                  <span className="capitalize font-medium text-slate-800 dark:text-slate-200">
                    {receiptData.connectionType.toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Package / Type:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {receiptData.packTitle}
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
                  onClick={() => handleDownloadRechargeReceipt(receiptData)}
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
                      setAmount("");
                      setSelectedPack(null);
                    }}
                  >
                    Recharge Another
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
      </div>
    </DashboardLayout>
  );
}
