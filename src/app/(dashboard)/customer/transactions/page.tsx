"use client";

import React, { useState } from "react";
import {
  History,
  Search,
  Download,
  FileSpreadsheet,
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
} from "@/components/ui";
import { useGetTransactionsQuery } from "@/redux/api/transactionsApi";
import { ROLES, TRANSACTION_TYPES, TRANSACTION_STATUS } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { IBankAccount, ITransaction } from "@/types";

export default function CustomerTransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

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

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
            >
              Export CSV Statement
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
      </div>
    </DashboardLayout>
  );
}
