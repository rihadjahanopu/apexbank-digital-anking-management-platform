import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User";
import { BankAccount } from "../src/models/BankAccount";
import { Transaction } from "../src/models/Transaction";
import { DepositRequest } from "../src/models/DepositRequest";
import { WithdrawalRequest } from "../src/models/WithdrawalRequest";
import { Loan } from "../src/models/Loan";
import { Notification } from "../src/models/Notification";
import { BankingSettings } from "../src/models/BankingSettings";
import { AuditLog } from "../src/models/AuditLog";
import { Card } from "../src/models/Card";
import {
  ROLES,
  USER_STATUS,
  ACCOUNT_TYPES,
  ACCOUNT_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  LOAN_TYPES,
  LOAN_STATUS,
  REQUEST_STATUS,
  NOTIFICATION_TYPES,
  DEFAULT_BANKING_SETTINGS,
  CARD_TYPES,
  CARD_NETWORKS,
  CARD_STATUS,
  KYC_DOCUMENT_TYPES,
  KYC_STATUS,
} from "../src/lib/constants";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bank_app";

export async function runSeed() {
  console.log("Connecting to MongoDB for seeding at:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  console.log("Purging existing collections...");
  await Promise.all([
    User.deleteMany({}),
    BankAccount.deleteMany({}),
    Transaction.deleteMany({}),
    DepositRequest.deleteMany({}),
    WithdrawalRequest.deleteMany({}),
    Loan.deleteMany({}),
    Card.deleteMany({}),
    Notification.deleteMany({}),
    BankingSettings.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log("Hashing default passwords and PINs...");
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash("AdminPassword123!", salt);
  const staffPassword = await bcrypt.hash("StaffPassword123!", salt);
  const customerPassword = await bcrypt.hash("CustomerPassword123!", salt);
  const defaultPin = await bcrypt.hash("1234", salt);

  // 1. Create Admin
  const admin = await User.create({
    name: "Alexander Vance (Admin)",
    email: "admin@apexbank.com",
    password: adminPassword,
    role: ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
    phone: "+1 (555) 019-2834",
    address: "100 Wall Street, New York, NY",
    nationalId: "SSN-990-11-8291",
    transactionPin: defaultPin,
    isVerified: true,
  });

  // 2. Create Bank Staff
  const staff = await User.create({
    name: "Elena Rostova (Staff Officer)",
    email: "staff@apexbank.com",
    password: staffPassword,
    role: ROLES.STAFF,
    status: USER_STATUS.ACTIVE,
    phone: "+1 (555) 018-9921",
    address: "45 Financial Center Plaza, New York, NY",
    nationalId: "SSN-880-22-1920",
    transactionPin: defaultPin,
    isVerified: true,
  });

  // 3. Create Customers
  const customer1 = await User.create({
    name: "Sophia Chen",
    email: "customer@apexbank.com",
    password: customerPassword,
    role: ROLES.CUSTOMER,
    status: USER_STATUS.ACTIVE,
    phone: "+1 (555) 014-4820",
    address: "742 Evergreen Terrace, Springfield",
    nationalId: "SSN-770-33-4019",
    transactionPin: defaultPin,
    isVerified: true,
    kycDocuments: [
      {
        docType: KYC_DOCUMENT_TYPES.NATIONAL_ID,
        docNumber: "SSN-770-33-4019",
        docUrl:
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' rx='15' fill='%231e293b'/><text x='30' y='50' fill='%2394a3b8' font-family='sans-serif' font-size='14'>GOVERNMENT IDENTITY CARD</text><text x='30' y='100' fill='%23f8fafc' font-family='sans-serif' font-size='18' font-weight='bold'>Sophia Chen</text><text x='30' y='130' fill='%2364748b' font-family='monospace' font-size='14'>ID: SSN-770-33-4019</text><text x='30' y='180' fill='%2310b981' font-family='sans-serif' font-size='12'>● VERIFIED GOVERNMENT RECORD</text></svg>",
        status: KYC_STATUS.APPROVED,
        submittedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const customer2 = await User.create({
    name: "Marcus Brody",
    email: "marcus@apexbank.com",
    password: customerPassword,
    role: ROLES.CUSTOMER,
    status: USER_STATUS.ACTIVE,
    phone: "+1 (555) 012-7744",
    address: "128 Silicon Parkway, Austin, TX",
    nationalId: "SSN-660-44-9182",
    transactionPin: defaultPin,
    isVerified: false,
    kycDocuments: [
      {
        docType: KYC_DOCUMENT_TYPES.PASSPORT,
        docNumber: "PASS-9901-US",
        docUrl:
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' rx='15' fill='%230f172a'/><text x='30' y='50' fill='%2394a3b8' font-family='sans-serif' font-size='14'>INTERNATIONAL PASSPORT</text><text x='30' y='100' fill='%23f8fafc' font-family='sans-serif' font-size='18' font-weight='bold'>Marcus Brody</text><text x='30' y='130' fill='%2364748b' font-family='monospace' font-size='14'>Doc: PASS-9901-US</text><text x='30' y='180' fill='%23f59e0b' font-family='sans-serif' font-size='12'>● PENDING COMPLIANCE AUDIT</text></svg>",
        status: KYC_STATUS.PENDING,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 4. Create Bank Accounts
  const sophiaSavings = await BankAccount.create({
    accountNumber: "1001004821",
    userId: customer1._id,
    accountType: ACCOUNT_TYPES.SAVINGS,
    status: ACCOUNT_STATUS.ACTIVE,
    balance: 14250.0,
    availableBalance: 14200.0,
    currency: "USD",
    dailyTransferLimit: 10000,
    minimumBalance: 50,
  });

  const sophiaCurrent = await BankAccount.create({
    accountNumber: "1002008492",
    userId: customer1._id,
    accountType: ACCOUNT_TYPES.CURRENT,
    status: ACCOUNT_STATUS.ACTIVE,
    balance: 5800.0,
    availableBalance: 5750.0,
    currency: "USD",
    dailyTransferLimit: 15000,
    minimumBalance: 50,
  });

  const marcusBusiness = await BankAccount.create({
    accountNumber: "1003009911",
    userId: customer2._id,
    accountType: ACCOUNT_TYPES.BUSINESS,
    status: ACCOUNT_STATUS.ACTIVE,
    balance: 48600.0,
    availableBalance: 48550.0,
    currency: "USD",
    dailyTransferLimit: 50000,
    minimumBalance: 50,
  });

  // 5. Create Virtual & Debit Cards
  await Card.create([
    {
      userId: customer1._id,
      accountId: sophiaSavings._id,
      cardNumber: "4532890123456789",
      maskedCardNumber: "•••• •••• •••• 6789",
      cardHolderName: "Sophia Chen",
      cardType: CARD_TYPES.VIRTUAL,
      network: CARD_NETWORKS.VISA,
      expiryMonth: 8,
      expiryYear: 2030,
      cvv: "892",
      pin: defaultPin,
      status: CARD_STATUS.ACTIVE,
      dailyOnlineLimit: 5000,
      dailyAtmLimit: 1000,
      dailyPosLimit: 3000,
      isOnlineEnabled: true,
      isAtmEnabled: true,
      isPosEnabled: true,
      isInternationalEnabled: true,
    },
    {
      userId: customer1._id,
      accountId: sophiaCurrent._id,
      cardNumber: "5324112233445566",
      maskedCardNumber: "•••• •••• •••• 5566",
      cardHolderName: "Sophia Chen",
      cardType: CARD_TYPES.DEBIT,
      network: CARD_NETWORKS.MASTERCARD,
      expiryMonth: 12,
      expiryYear: 2029,
      cvv: "419",
      pin: defaultPin,
      status: CARD_STATUS.ACTIVE,
      dailyOnlineLimit: 2500,
      dailyAtmLimit: 2000,
      dailyPosLimit: 4000,
      isOnlineEnabled: true,
      isAtmEnabled: true,
      isPosEnabled: true,
      isInternationalEnabled: false,
    },
  ]);

  // 6. Create Transactions
  await Transaction.create([
    {
      transactionId: "TXN-20261101-001",
      senderAccount: sophiaSavings._id,
      receiverAccount: marcusBusiness._id,
      senderUserId: customer1._id,
      receiverUserId: customer2._id,
      type: TRANSACTION_TYPES.TRANSFER,
      amount: 1500.0,
      fee: 2.5,
      status: TRANSACTION_STATUS.COMPLETED,
      description: "Supplier Invoice Payment #8491",
      reference: "INV-8491",
      isSuspicious: false,
    },
    {
      transactionId: "TXN-20261105-002",
      senderAccount: sophiaCurrent._id,
      receiverAccount: marcusBusiness._id,
      senderUserId: customer1._id,
      receiverUserId: customer2._id,
      type: TRANSACTION_TYPES.TRANSFER,
      amount: 22000.0, // Exceeds threshold ($15,000)
      fee: 10.0,
      status: TRANSACTION_STATUS.COMPLETED,
      description: "High-value machinery acquisition transfer",
      reference: "MACH-99",
      isSuspicious: true,
      suspiciousReason: "Transaction amount exceeds threshold of $15,000.00",
    },
    {
      transactionId: "TXN-20261110-003",
      receiverAccount: sophiaSavings._id,
      receiverUserId: customer1._id,
      type: TRANSACTION_TYPES.DEPOSIT,
      amount: 5000.0,
      fee: 0,
      status: TRANSACTION_STATUS.COMPLETED,
      description: "Branch Counter Cash Deposit",
      approvedBy: staff._id,
      isSuspicious: false,
    },
  ]);

  // 6. Deposit and Withdrawal Requests
  await DepositRequest.create({
    accountId: sophiaCurrent._id,
    userId: customer1._id,
    amount: 1200.0,
    description: "Consulting stipend deposit check",
    status: REQUEST_STATUS.PENDING,
  });

  await WithdrawalRequest.create({
    accountId: marcusBusiness._id,
    userId: customer2._id,
    amount: 3500.0,
    description: "Office equipment cash purchase withdrawal",
    status: REQUEST_STATUS.PENDING,
  });

  // 7. Loans
  const dueDate1 = new Date();
  dueDate1.setMonth(dueDate1.getMonth() + 1);
  const dueDate2 = new Date();
  dueDate2.setMonth(dueDate2.getMonth() + 2);

  await Loan.create({
    loanNumber: "LN-2026-8801",
    userId: customer1._id,
    accountId: sophiaSavings._id,
    loanType: LOAN_TYPES.PERSONAL,
    amount: 10000.0,
    interestRate: 7.5,
    durationMonths: 12,
    monthlyRepayment: 867.57,
    totalRepayment: 10410.84,
    remainingBalance: 9543.27,
    monthlyIncome: 6500.0,
    employmentStatus: "Full-Time Senior Consultant",
    purpose: "Home renovation and office setup",
    status: LOAN_STATUS.ACTIVE,
    forwardedToAdmin: true,
    reviewedBy: staff._id,
    approvedBy: admin._id,
    disbursedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    repayments: [
      {
        installmentNumber: 1,
        amount: 867.57,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "PAID",
        transactionId: "TXN-LN-REPAY-01",
      },
      {
        installmentNumber: 2,
        amount: 867.57,
        dueDate: dueDate1,
        status: "PENDING",
      },
      {
        installmentNumber: 3,
        amount: 867.57,
        dueDate: dueDate2,
        status: "PENDING",
      },
    ],
  });

  // 8. Banking Settings
  await BankingSettings.create({
    ...DEFAULT_BANKING_SETTINGS,
    updatedBy: admin._id,
  });

  // 9. Notifications
  await Notification.create([
    {
      userId: customer1._id,
      title: "Welcome to Apex Bank",
      message: "Your Savings & Current accounts have been successfully verified.",
      type: NOTIFICATION_TYPES.SECURITY_ALERT,
      isRead: false,
    },
    {
      userId: customer1._id,
      title: "Transfer Processed",
      message: "Fund transfer of $1,500.00 to Marcus Brody was successfully executed.",
      type: NOTIFICATION_TYPES.TRANSFER_SUCCESS,
      isRead: true,
    },
    {
      userId: customer2._id,
      title: "Funds Received",
      message: "You received $1,500.00 from Sophia Chen into Account 1003009911.",
      type: NOTIFICATION_TYPES.TRANSFER_RECEIVED,
      isRead: false,
    },
  ]);

  // 10. Audit Log
  await AuditLog.create([
    {
      userId: admin._id,
      userRole: ROLES.ADMIN,
      action: "INITIAL_SEED_SYSTEM",
      category: "SETTINGS",
      details: { info: "Initial core system data seeded successfully" },
    },
  ]);

  console.log("Database seeded successfully!");
  console.log("\n=========================================");
  console.log("DEMO ACCOUNTS READY:");
  console.log("1. Admin:    admin@apexbank.com    / AdminPassword123!");
  console.log("2. Staff:    staff@apexbank.com    / StaffPassword123!");
  console.log("3. Customer: customer@apexbank.com / CustomerPassword123!");
  console.log("   (Default Transfer PIN for all accounts: 1234)");
  console.log("=========================================\n");
}

// Allow CLI execution:
if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
