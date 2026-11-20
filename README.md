# 🏦 Apex Bank — Advanced Digital Banking Management System

A complete, production-grade digital banking web application built with **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS v4**, **Redux Toolkit + RTK Query**, and **MongoDB + Mongoose**.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **MongoDB** 7+ (local installation or Docker)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` in the root directory:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/bank_app
JWT_SECRET=apex_digital_banking_super_secret_jwt_key_2026_production_grade
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_NAME="Apex Bank"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start MongoDB

```bash
# Option A: Local MongoDB
mongod --dbpath /data/db

# Option B: Docker
docker run -d -p 27017:27017 --name mongo-bank mongo:7
```

### 4. Seed the Database

```bash
npm run seed
```

This creates three demo accounts with pre-configured balances and transaction history.

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 👤 Demo Accounts

| Role           | Email                   | Password               | PIN    |
| -------------- | ----------------------- | ---------------------- | ------ |
| **Admin**      | `admin@apexbank.com`    | `AdminPassword123!`    | —      |
| **Bank Staff** | `staff@apexbank.com`    | `StaffPassword123!`    | —      |
| **Customer**   | `customer@apexbank.com` | `CustomerPassword123!` | `1234` |

> **Note:** The Login page has 1-click **Demo Account** fill buttons — no need to type credentials manually.

---

## ✨ Features

### 🔐 Authentication & Security

- JWT-based session management (HttpOnly cookies)
- bcrypt password hashing
- Hashed transaction PINs
- Role-based access control (RBAC) enforced **server-side**
- Account status validation on every request
- Rate limiting on sensitive endpoints
- IDOR protection — customers can only access their own data
- Comprehensive audit logging
- First registered user auto-becomes Admin

### 👑 Admin Dashboard

- Live KPI stats: total customers, accounts, balances, deposits, withdrawals, loans
- Interactive Recharts: transaction volume trends, deposits vs withdrawals, loan statistics
- Customer management (activate/deactivate/block/verify KYC)
- Bank account management (freeze/unfreeze, set limits, close)
- Staff provisioning
- Deposit/withdrawal request approval
- Loan approval/rejection with internal notes
- Suspicious transaction queue & review
- Global banking settings (transfer fees, limits, fraud thresholds)
- Full audit log browser with filters

### 🏢 Bank Staff Dashboard

- Register new customers
- Create bank accounts for customers
- View & search all customers and transactions
- Review pending deposit/withdrawal requests
- Review loan applications, add internal notes, forward to Admin
- Flag suspicious transactions

### 👤 Customer Dashboard

- Personalized overview: balances, deposits, withdrawals, active loans
- Multiple account switching with animated account cards
- Monthly financial activity chart

### 💳 Card Management & Service Requests
- 16-Digit Luhn algorithm verified card number generation (Visa BIN `4532`, Mastercard BIN `5324`)
- Secure CVV generator and encrypted card credential vault
- Instant Virtual Card issuance linked directly to active depository checking/savings accounts
- **Card Issue Request System**:
  - Customer submits card issuance application (specifying account, card type: Virtual/Debit/Credit, network: Visa/Mastercard, and reason)
  - Admin & Staff review queue with 1-click Approve (generates card with Luhn PAN & PIN) or Reject with remarks
- **Card Cancellation / Removal Request System**:
  - Customer submits card removal/cancellation request for lost, stolen, damaged, or unneeded cards
  - Admin & Staff review queue to approve and permanently block the card, or reject with officer notes
- Interactive Card Security Controls: toggle online e-commerce, in-store POS swipes, ATM cash withdrawals, and international cross-border transactions
- Dynamic spending limit sliders: configure daily online, POS, and ATM transaction ceilings
- 4-digit card PIN authentication to decrypt and reveal unmasked 16-digit PAN and CVV

### 🏦 Customer Bank Account Closure Governance
- Customer self-service account termination application on active accounts
- Real-time balance snapshot at application time with optional target payout account for balance disbursement
- Pre-populated common reasons (relocation, entity dissolution, unneeded reserve) or custom notes
- Admin & Bank Staff review and audit desk:
  - Validates account and balance settlement
  - On approval: atomically transitions `BankAccount.status = CLOSED` and permanently blocks all associated cards
  - On rejection: records officer remarks and notifies customer with zero status modification

### 🔐 Two-Factor Authentication (2FA) & Digital KYC
- RFC 6238 TOTP Two-Factor Authentication with QR code setup and dynamic 6-digit challenge at login
- Identity KYC Compliance Queue: upload National ID, Passport, Driver's License; Admin/Staff verification desk with automatic verified status promotion

### 💸 Fund Transfers

- Atomic intra-bank transfers (debit + credit in a single Mongoose session)
- Automatic rollback if any step fails — money never disappears
- Transfer fee calculation (configurable %)
- Duplicate/idempotency protection
- Transaction PIN verification
- Fraud velocity checks (flags rapid successive transfers)

### 🏧 Deposits & Withdrawals

- Customer submits requests → Staff/Admin approves/rejects
- Approval atomically updates balance + creates transaction record
- Rejection has zero balance impact

### 📋 Transaction Management

- Full history with search, date range, type, and status filters
- Paginated tables
- **PDF receipt** generation (jsPDF + AutoTable)
- **CSV statement** export
- Transaction types: Deposit, Withdrawal, Transfer, Loan Disbursement, Loan Repayment

### 🏛️ Loan Management

- Multi-type loans: Personal, Home, Business, Education, Vehicle
- Interactive amortization calculator during application
- Full status lifecycle: Pending → Under Review → Approved → Active → Completed
- Loan disbursement via proper banking transaction
- Installment-by-installment repayment tracking
- Internal staff notes & Admin approval workflow

### 🔔 Notifications

- In-app notification system with unread count badge
- Events: transfers received, deposit/withdrawal status, loan updates

### 🕵️ Fraud Detection

- Rule-based suspicious transaction detection:
  - Large single transactions above configurable threshold
  - Rapid successive transactions (velocity check)
  - Round-number large transfers
- Admin suspicious transaction review queue

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Register pages
│   ├── (dashboard)/
│   │   ├── admin/           # Admin-only pages
│   │   ├── staff/           # Staff-only pages
│   │   └── customer/        # Customer self-service pages
│   └── api/                 # Next.js API Route Handlers (server-side)
├── components/
│   ├── layout/              # DashboardLayout, Sidebar, Navbar, NotificationDrawer
│   ├── providers/           # Redux Provider
│   └── ui/                  # Reusable UI: Button, Card, Table, Badge, Modal, etc.
├── lib/
│   ├── auth.ts              # JWT helpers, requireAuth() gatekeeper
│   ├── money.ts             # Precision-safe financial arithmetic
│   ├── constants.ts         # Enums, role names, default settings
│   ├── utils.ts             # Date formatting, masking utilities
│   └── validations/         # Zod schemas
├── models/                  # Mongoose models
│   ├── User.ts
│   ├── BankAccount.ts
│   ├── Transaction.ts
│   ├── DepositRequest.ts
│   ├── WithdrawalRequest.ts
│   ├── Loan.ts
│   ├── LoanRepayment.ts
│   ├── Notification.ts
│   ├── BankingSettings.ts
│   └── AuditLog.ts
├── redux/
│   ├── store.ts             # Configured Redux store
│   ├── slices/              # Feature slices (auth, account, transaction, ...)
│   └── api/                 # RTK Query service files
├── types/
│   └── index.ts             # Shared TypeScript interfaces
└── scripts/
    └── seed.ts              # Database seeding script
```

---

## 🛠️ Technology Stack

| Category         | Technology                             |
| ---------------- | -------------------------------------- |
| Framework        | Next.js 16.4.6 (App Router, Turbopack) |
| Language         | TypeScript 5                           |
| Styling          | Tailwind CSS v4                        |
| State Management | Redux Toolkit + RTK Query              |
| Database         | MongoDB 7 + Mongoose 9                 |
| Auth             | JWT (HttpOnly Cookie) + bcrypt         |
| Validation       | Zod v4 + React Hook Form               |
| Charts           | Recharts 3                             |
| Icons            | Lucide React                           |
| Toasts           | Sonner                                 |
| PDF              | jsPDF + jspdf-autotable                |

---

## 🏗️ Build & Lint

```bash
npm run build   # Production build (all 62 routes)
npm run lint    # ESLint (0 errors, 0 warnings)
npm run dev     # Development server with Turbopack
npm run seed    # Seed demo data into MongoDB
```

---

## 🔒 Security Architecture

- All balance mutations happen **server-side only** via validated API routes
- `requireAuth(req, allowedRoles)` enforced on every protected endpoint
- Customers cannot access other users' accounts (IDOR protection)
- Transaction PINs stored as bcrypt hashes, never plain text
- Audit log captures: who did what, when, from which IP
- Sensitive operations (transfer, approval, loan disbursal) are fully logged
- No monetary values from frontend are trusted — all recalculated server-side

---

## 📊 Database Models

| Model               | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `User`              | Customers, Staff, Admins with status & KYC                 |
| `BankAccount`       | Savings/Current/Business accounts with Decimal128 balances |
| `Transaction`       | Immutable ledger of all financial movements                |
| `DepositRequest`    | Pending deposit requests awaiting approval                 |
| `WithdrawalRequest` | Pending withdrawal requests awaiting approval              |
| `Loan`              | Loan applications through full lifecycle                   |
| `LoanRepayment`     | Installment schedule with payment tracking                 |
| `Notification`      | In-app notification records                                |
| `BankingSettings`   | Global configurable bank parameters                        |
| `AuditLog`          | Immutable audit trail of all admin/staff actions           |
