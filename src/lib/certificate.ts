import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface AccountCertificateData {
  accountNumber: string;
  iban?: string;
  routingNumber?: string;
  swiftBic?: string;
  accountType: string;
  currency: string;
  holderName: string;
  holderEmail?: string;
  holderPhone?: string;
  branchName?: string;
  initialDeposit: number;
  issuedAt?: string;
  verifiedViaOcr?: boolean;
  status?: string;
}

export function generateAccountCertificatePDF(data: AccountCertificateData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Outer border & background decoration
  doc.setDrawColor(2, 132, 199); // Sky/cyan primary
  doc.setLineWidth(1.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Bank Header Banner
  doc.setFillColor(15, 23, 42); // Deep slate
  doc.rect(12, 12, pageWidth - 24, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ANTIGRAVITY FEDERAL BANK", pageWidth / 2, 26, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text("Global Depository & Institutional Banking Services", pageWidth / 2, 33, {
    align: "center",
  });
  doc.text("Member FDIC • Equal Housing Lender • ISO 20022 Compliant", pageWidth / 2, 39, {
    align: "center",
  });

  // Certificate Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("OFFICIAL ACCOUNT OPENING CERTIFICATE", pageWidth / 2, 60, {
    align: "center",
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "This certificate confirms the issuance and regulatory activation of the depository account below.",
    pageWidth / 2,
    66,
    { align: "center" }
  );

  // Key Specifications Table
  const issueDate = data.issuedAt || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  autoTable(doc, {
    startY: 74,
    theme: "striped",
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    body: [
      ["Account Holder Name", data.holderName],
      ["Depository Account Number", `#${data.accountNumber}`],
      ["International IBAN", data.iban || `US79AGBK026007491${data.accountNumber}`],
      ["SWIFT / BIC Identifier", data.swiftBic || "AGBKUS33XXX"],
      ["Fedwire / Routing Transit (ABA)", data.routingNumber || "026007491"],
      ["Account Classification", `${data.accountType} Vault`],
      ["Depository Status", data.status === "PENDING" ? "PENDING STAFF REVIEW & ACTIVATION" : "ACTIVE & REGULATORY COMPLIANT"],
      ["Base Currency", data.currency || "USD"],
      ["Branch of Issuance", data.branchName || "Main Financial Center"],
      [
        "Initial Credited Balance",
        `$${data.initialDeposit.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${data.currency}`,
      ],
      ["Identity Verification Protocol", data.verifiedViaOcr ? "Biometric & Optical OCR Verified" : "Branch Compliance Verified"],
      ["Date of Issuance & Activation", issueDate],
    ],
    styles: {
      fontSize: 9.5,
      cellPadding: 3.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70 },
      1: { cellWidth: "auto" },
    },
    margin: { left: 20, right: 20 },
  });

  // Regulatory & Security Notice
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 190;

  doc.setFillColor(241, 245, 249);
  doc.rect(20, finalY + 10, pageWidth - 40, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("COMPLIANCE & LEGAL NOTICE", 25, finalY + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const termsText =
    "This depository account is maintained in accordance with Anti-Money Laundering (AML), Bank Secrecy Act (BSA), and Federal Reserve banking standards. Funds are eligible for regulatory insurance protection up to applicable statutory limits. For wire transfers, ACH settlements, or debit card activation, refer to the account and routing credentials above.";
  doc.text(termsText, 25, finalY + 22, { maxWidth: pageWidth - 50 });

  // Signatures Area
  const sigY = finalY + 50;

  doc.setDrawColor(148, 163, 184);
  doc.line(25, sigY, 85, sigY);
  doc.line(pageWidth - 85, sigY, pageWidth - 25, sigY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Authorized Bank Officer", 55, sigY + 5, { align: "center" });
  doc.text("Account Holder Signature", pageWidth - 55, sigY + 5, { align: "center" });

  // Official Stamp simulation
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(1);
  doc.circle(pageWidth / 2, sigY - 5, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(2, 132, 199);
  doc.text("VERIFIED", pageWidth / 2, sigY - 6, { align: "center" });
  doc.text("OFFICIAL SEAL", pageWidth / 2, sigY - 2, { align: "center" });
  doc.text("2026", pageWidth / 2, sigY + 2, { align: "center" });

  // Save the PDF directly to download
  doc.save(`Bank_Account_Certificate_${data.accountNumber}.pdf`);
}
