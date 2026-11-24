"use client";

import React, { useState } from "react";
import {
  History,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
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
  EmptyState,
  Modal,
} from "@/components/ui";
import { useGetTransactionsQuery } from "@/redux/api/transactionsApi";
import { useGetMyAccountsQuery } from "@/redux/api/accountsApi";
import { useAppSelector } from "@/redux/hooks";
import {
  generateAccountStatementPDF,
  StatementTransactionItem,
} from "@/lib/statement-pdf";
import { ROLES, TRANSACTION_TYPES, TRANSACTION_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { IBankAccount, ITransaction } from "@/types";

interface StatementPeriodOption {
  id: "1M" | "3M" | "6M" | "12M" | "24M" | "CUSTOM";
  label: string;
  bengali: string;
  badge?: "Popular" | "Standard" | "Extended";
}

const STATEMENT_PERIODS: StatementPeriodOption[] = [
  { id: "6M", label: "6 Months", bengali: "গত ৬ মাস", badge: "Popular" },
  { id: "12M", label: "12 Months (1 Year)", bengali: "গত ১ বছর", badge: "Standard" },
  { id: "24M", label: "24 Months (2 Years)", bengali: "গত ২ বছর", badge: "Extended" },
  { id: "3M", label: "3 Months", bengali: "গত ৩ মাস" },
  { id: "1M", label: "1 Month", bengali: "গত ১ মাস" },
  { id: "CUSTOM", label: "Custom Range", bengali: "কাস্টম রেঞ্জ" },
];

export default function CustomerTransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Statement Modal State
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementAccountId, setStatementAccountId] = useState<string>("");
  const [statementPeriod, setStatementPeriod] = useState<"1M" | "3M" | "6M" | "12M" | "24M" | "CUSTOM">("6M");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isGeneratingStatement, setIsGeneratingStatement] = useState(false);

  const { data: accountsData } = useGetMyAccountsQuery();
  const accounts = accountsData?.accounts || [];
  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading } = useGetTransactionsQuery({
    search,
    type: typeFilter,
    status: statusFilter,
    page,
    limit: 15,
  });

  const transactions = data?.transactions || [];
  const totalPages = data?.totalPages || 1;

  // 1. Export Account Statement to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export.");
      return;
    }

    const headers = [
      "Transaction ID",
      "Type",
      "Amount",
      "Fee",
      "Sender Account",
      "Receiver Account",
      "Status",
      "Description",
      "Date",
    ];

    const rows = transactions.map((t) => {
      const sender = t.senderAccount as IBankAccount;
      const receiver = t.receiverAccount as IBankAccount;
      return [
        t.transactionId,
        t.type,
        t.amount.toFixed(2),
        t.fee.toFixed(2),
        sender?.accountNumber || "N/A",
        receiver?.accountNumber || "N/A",
        t.status,
        `"${t.description.replace(/"/g, '""')}"`,
        formatDateTime(t.createdAt),
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ApexBank_Statement_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Statement exported successfully!");
  };

  // 2. Download Multi-Period Bank Statement PDF (6M, 12M, 24M, etc.)
  const handleDownloadStatementPDF = async () => {
    const targetAccount =
      accounts.find((a) => a._id === (statementAccountId || accounts[0]?._id)) ||
      accounts[0];

    if (!targetAccount) {
      toast.error("No bank account found to generate statement.");
      return;
    }

    let sDate = "";
    let eDate = new Date().toISOString().split("T")[0];
    let pLabel = "Last 6 Months (গত ৬ মাস)";

    if (statementPeriod === "CUSTOM") {
      if (!customStartDate || !customEndDate) {
        toast.error("Please select both start date and end date.");
        return;
      }
      if (new Date(customStartDate) > new Date(customEndDate)) {
        toast.error("Start date cannot be after end date.");
        return;
      }
      sDate = customStartDate;
      eDate = customEndDate;
      pLabel = `Custom Range (${sDate} to ${eDate})`;
    } else {
      const end = new Date();
      const start = new Date();
      if (statementPeriod === "1M") {
        start.setMonth(start.getMonth() - 1);
        pLabel = "Last 1 Month (গত ১ মাস)";
      } else if (statementPeriod === "3M") {
        start.setMonth(start.getMonth() - 3);
        pLabel = "Last 3 Months (গত ৩ মাস)";
      } else if (statementPeriod === "6M") {
        start.setMonth(start.getMonth() - 6);
        pLabel = "Last 6 Months (গত ৬ মাস)";
      } else if (statementPeriod === "12M") {
        start.setFullYear(start.getFullYear() - 1);
        pLabel = "Last 12 Months / 1 Year (গত ১ বছর)";
      } else if (statementPeriod === "24M") {
        start.setFullYear(start.getFullYear() - 2);
        pLabel = "Last 24 Months / 2 Years (গত ২ বছর)";
      }
      sDate = start.toISOString().split("T")[0];
      eDate = end.toISOString().split("T")[0];
    }

    try {
      setIsGeneratingStatement(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const queryParams = new URLSearchParams({
        accountId: targetAccount._id,
        startDate: sDate,
        endDate: eDate,
        limit: "1000",
      });

      const res = await fetch(`/api/transactions?${queryParams.toString()}`, {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to load statement transactions.");
      }

      const txList = json.transactions || [];
      const mappedTxns: StatementTransactionItem[] = txList.map(
        (tx: ITransaction) => {
          const sender = tx.senderAccount as IBankAccount | undefined;
          const isDebit =
            sender?._id === targetAccount._id ||
            sender?.accountNumber === targetAccount.accountNumber;
          return {
            transactionId: tx.transactionId,
            date: tx.createdAt as unknown as string,
            type: tx.type,
            description: tx.description || "Apex Bank Digital Transfer",
            amount: tx.amount,
            fee: tx.fee || 0,
            isDebit,
          };
        }
      );

      await generateAccountStatementPDF({
        account: {
          accountNumber: targetAccount.accountNumber,
          accountType: targetAccount.accountType,
          currency: targetAccount.currency || "BDT",
          balance: targetAccount.balance,
          availableBalance: targetAccount.availableBalance,
          branchName: targetAccount.branchName,
        },
        customer: {
          name: user?.name || "Account Holder",
          email: user?.email || "customer@apexbank.com",
          phone: user?.phone,
          address: user?.address,
          nationalId: user?.nationalId,
        },
        periodLabel: pLabel,
        startDate: sDate,
        endDate: eDate,
        transactions: mappedTxns,
      });

      toast.success(`Account statement for ${pLabel} generated successfully!`);
      setIsStatementModalOpen(false);
    } catch (err: unknown) {
      console.error("Statement PDF generation error:", err);
      const error = err as Error;
      toast.error(error.message || "Failed to generate account statement.");
    } finally {
      setIsGeneratingStatement(false);
    }
  };

  // 2. Generate Professional PDF Receipt
  const handleDownloadPDFReceipt = (tx: ITransaction) => {
    try {
      const doc = new jsPDF();
      const sender = tx.senderAccount as IBankAccount;
      const receiver = tx.receiverAccount as IBankAccount;

      // Header Banner
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(0, 0, 210, 35, "F");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text("APEX BANK", 15, 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("OFFICIAL TRANSACTION RECEIPT", 130, 22);

      // Receipt Metadata
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(11);
      doc.text(`Receipt Reference: ${tx.transactionId}`, 15, 48);
      doc.text(`Issuance Date: ${formatDateTime(tx.createdAt)}`, 15, 55);

      // Financial Details Table
      autoTable(doc, {
        startY: 65,
        head: [["Transaction Property", "Details"]],
        body: [
          ["Transaction ID", tx.transactionId],
          ["Transaction Category", tx.type],
          ["Transfer Amount", formatCurrency(tx.amount)],
          ["Transaction Network Fee", formatCurrency(tx.fee)],
          [
            "Sender Depository Account",
            sender ? `#${sender.accountNumber} (${sender.accountType})` : "Counter / Desk Inflow",
          ],
          [
            "Beneficiary Account",
            receiver ? `#${receiver.accountNumber} (${receiver.accountType})` : "Direct Cash Outflow",
          ],
          ["Settlement Status", tx.status],
          ["Memo / Reference", tx.description || "Apex Bank Digital Transfer"],
        ],
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 4 },
      });

      // Footer
      const finalY =
        (doc as unknown as { lastAutoTable?: { finalY?: number } })
          .lastAutoTable?.finalY || 180;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "This is an electronically generated and cryptographically settled transaction receipt issued by Apex Bank.",
        15,
        finalY + 20
      );
      doc.text("Member FDIC • Equal Housing Lender • ISO 27001 Certified Core", 15, finalY + 26);

      doc.save(`Receipt_${tx.transactionId}.pdf`);
      toast.success(`PDF Receipt downloaded for ${tx.transactionId}`);
    } catch (e) {
      console.error("PDF error:", e);
      toast.error("Failed to generate PDF receipt.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Account Statements & Ledger
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comprehensive ledger records with verifiable electronic PDF receipts and CSV data exports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
            >
              Export CSV Statement
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsStatementModalOpen(true)}
              leftIcon={<FileDown className="h-4 w-4" />}
            >
              Download Bank Statement (PDF)
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:flex-1">
              <Input
                placeholder="Search by transaction ID or description..."
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
                  { value: "ALL", label: "All Types" },
                  { value: TRANSACTION_TYPES.TRANSFER, label: "Transfer" },
                  { value: TRANSACTION_TYPES.DEPOSIT, label: "Deposit" },
                  { value: TRANSACTION_TYPES.WITHDRAWAL, label: "Withdrawal" },
                  {
                    value: TRANSACTION_TYPES.LOAN_DISBURSEMENT,
                    label: "Loan Disbursed",
                  },
                  {
                    value: TRANSACTION_TYPES.LOAN_REPAYMENT,
                    label: "Loan Repaid",
                  },
                ]}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: TRANSACTION_STATUS.COMPLETED, label: "Completed" },
                  { value: TRANSACTION_STATUS.PENDING, label: "Pending" },
                  { value: TRANSACTION_STATUS.FAILED, label: "Failed" },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading transaction history...
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={<History className="h-7 w-7" />}
              title="No transactions found"
              description="No ledger transactions match your chosen filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {tx.transactionId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" size="sm">
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === TRANSACTION_STATUS.COMPLETED
                            ? "success"
                            : "warning"
                        }
                        size="sm"
                        dot
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDateTime(tx.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPDFReceipt(tx)}
                        title="Download PDF Receipt"
                        leftIcon={<Download className="h-3.5 w-3.5" />}
                      >
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
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
        {/* Modal: Download Multi-Period Bank Statement PDF */}
        <Modal
          isOpen={isStatementModalOpen}
          onClose={() => setIsStatementModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <span>Download Official Bank Statement (অ্যাকাউন্ট স্টেটমেন্ট)</span>
            </div>
          }
          description="Generate certified, verifiable electronic bank statements with official NPSB ledger records and stamp seal."
          maxWidth="lg"
        >
          <div className="space-y-5 pt-1">
            {/* 1. Account Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Depository Account (অ্যাকাউন্ট নির্বাচন করুন)
              </label>
              <Select
                value={statementAccountId || (accounts[0]?._id ?? "")}
                onChange={(e) => setStatementAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountType} (#{acc.accountNumber}) — Balance: {formatCurrency(acc.availableBalance)}
                  </option>
                ))}
              </Select>
            </div>

            {/* 2. Period Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Statement Period (স্টেটমেন্ট সময়সীমা)
                </label>
                <span className="text-[11px] text-emerald-600 font-medium">
                  Official Banking Formats
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STATEMENT_PERIODS.map((p) => {
                  const isSelected = statementPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setStatementPeriod(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{p.label}</span>
                        {p.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                              p.badge === "Popular"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                                : p.badge === "Standard"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                            }`}
                          >
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {p.bengali}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Date Pickers */}
            {statementPeriod === "CUSTOM" && (
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Start Date (শুরুর তারিখ)
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    End Date (শেষ তারিখ)
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Period Preview Card */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Certified Bank Ledger Output</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Official statement includes debit/credit breakdown, opening & closing balances, cryptographic SHA256 audit hash, and scannable QR verification.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsStatementModalOpen(false)}
                disabled={isGeneratingStatement}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleDownloadStatementPDF}
                isLoading={isGeneratingStatement}
                leftIcon={<FileDown className="h-4 w-4" />}
              >
                Generate Statement PDF
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
