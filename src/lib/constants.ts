/**
 * Banking System Constants
 */

export const ROLES = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  CUSTOMER: "CUSTOMER",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  BLOCKED: "BLOCKED",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const ACCOUNT_TYPES = {
  SAVINGS: "SAVINGS",
  CURRENT: "CURRENT",
  BUSINESS: "BUSINESS",
} as const;

export type AccountType = (typeof ACCOUNT_TYPES)[keyof typeof ACCOUNT_TYPES];

export const ACCOUNT_STATUS = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  FROZEN: "FROZEN",
  CLOSED: "CLOSED",
} as const;

export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export const TRANSACTION_TYPES = {
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  TRANSFER: "TRANSFER",
  LOAN_DISBURSEMENT: "LOAN_DISBURSEMENT",
  LOAN_REPAYMENT: "LOAN_REPAYMENT",
  BANGLA_QR_PAYMENT: "BANGLA_QR_PAYMENT",
  MOBILE_RECHARGE: "MOBILE_RECHARGE",
} as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

export const TRANSACTION_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REVERSED: "REVERSED",
} as const;

export type TransactionStatus = (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

export const LOAN_TYPES = {
  PERSONAL: "PERSONAL",
  HOME: "HOME",
  BUSINESS: "BUSINESS",
  EDUCATION: "EDUCATION",
  VEHICLE: "VEHICLE",
} as const;

export type LoanType = (typeof LOAN_TYPES)[keyof typeof LOAN_TYPES];

export const LOAN_STATUS = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
} as const;

export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS];

export const REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];

export const NOTIFICATION_TYPES = {
  TRANSFER_SUCCESS: "TRANSFER_SUCCESS",
  TRANSFER_RECEIVED: "TRANSFER_RECEIVED",
  DEPOSIT_APPROVED: "DEPOSIT_APPROVED",
  DEPOSIT_REJECTED: "DEPOSIT_REJECTED",
  WITHDRAWAL_APPROVED: "WITHDRAWAL_APPROVED",
  WITHDRAWAL_REJECTED: "WITHDRAWAL_REJECTED",
  LOAN_APPROVED: "LOAN_APPROVED",
  LOAN_REJECTED: "LOAN_REJECTED",
  LOAN_DISBURSED: "LOAN_DISBURSED",
  LOAN_REPAYMENT: "LOAN_REPAYMENT",
  ACCOUNT_FROZEN: "ACCOUNT_FROZEN",
  ACCOUNT_UNFROZEN: "ACCOUNT_UNFROZEN",
  CARD_REQUEST_APPROVED: "CARD_REQUEST_APPROVED",
  CARD_REQUEST_REJECTED: "CARD_REQUEST_REJECTED",
  ACCOUNT_CLOSURE_APPROVED: "ACCOUNT_CLOSURE_APPROVED",
  ACCOUNT_CLOSURE_REJECTED: "ACCOUNT_CLOSURE_REJECTED",
  ACCOUNT_ACTIVATED: "ACCOUNT_ACTIVATED",
  ACCOUNT_REJECTED: "ACCOUNT_REJECTED",
  SECURITY_ALERT: "SECURITY_ALERT",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const CARD_TYPES = {
  VIRTUAL: "VIRTUAL",
  DEBIT: "DEBIT",
  CREDIT: "CREDIT",
} as const;

export type CardType = (typeof CARD_TYPES)[keyof typeof CARD_TYPES];

export const CARD_REQUEST_TYPES = {
  ISSUE: "ISSUE",
  REMOVE: "REMOVE",
} as const;

export type CardRequestType = (typeof CARD_REQUEST_TYPES)[keyof typeof CARD_REQUEST_TYPES];

export const CARD_NETWORKS = {
  VISA: "VISA",
  MASTERCARD: "MASTERCARD",
} as const;

export type CardNetwork = (typeof CARD_NETWORKS)[keyof typeof CARD_NETWORKS];

export const CARD_STATUS = {
  ACTIVE: "ACTIVE",
  FROZEN: "FROZEN",
  BLOCKED: "BLOCKED",
  EXPIRED: "EXPIRED",
} as const;

export type CardStatus = (typeof CARD_STATUS)[keyof typeof CARD_STATUS];

export const KYC_DOCUMENT_TYPES = {
  NATIONAL_ID: "NATIONAL_ID",
  PASSPORT: "PASSPORT",
  DRIVING_LICENSE: "DRIVING_LICENSE",
  UTILITY_BILL: "UTILITY_BILL",
} as const;

export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[keyof typeof KYC_DOCUMENT_TYPES];

export const KYC_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type KycStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];

export const DEFAULT_BANKING_SETTINGS = {
  minimumAccountBalance: 50, // $50
  dailyTransferLimit: 10000, // $10,000
  maximumTransactionAmount: 50000, // $50,000
  transferFeePercentage: 0.5, // 0.5%
  minTransferFee: 1.0, // $1
  suspiciousTransactionThreshold: 15000, // $15,000 triggers alert
  rapidTransactionWindowMinutes: 5,
  rapidTransactionCountLimit: 4,
  loanInterestRateDefault: 7.5, // 7.5% per annum
  maxLoanDurationMonths: 60,
};
