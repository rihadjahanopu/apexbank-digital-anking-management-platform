import {
  UserRole,
  UserStatus,
  AccountType,
  AccountStatus,
  TransactionType,
  TransactionStatus,
  LoanType,
  LoanStatus,
  RequestStatus,
  NotificationType,
  CardType,
  CardRequestType,
  CardNetwork,
  CardStatus,
  KycDocumentType,
  KycStatus,
} from "@/lib/constants";

export type {
  UserRole,
  UserStatus,
  AccountType,
  AccountStatus,
  TransactionType,
  TransactionStatus,
  LoanType,
  LoanStatus,
  RequestStatus,
  NotificationType,
  CardType,
  CardRequestType,
  CardNetwork,
  CardStatus,
  KycDocumentType,
  KycStatus,
};

export interface IKycDocument {
  _id?: string;
  docType: KycDocumentType;
  docNumber: string;
  docUrl: string;
  status: KycStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string | IUser;
  remarks?: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  address?: string;
  nationalId?: string;
  transactionPinSet: boolean;
  isVerified: boolean;
  twoFactorEnabled?: boolean;
  kycDocuments?: IKycDocument[];
  avatarUrl?: string;
  hasAccount?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface INominee {
  name: string;
  relation: string;
  phone?: string;
  nationalId?: string;
  sharePercent: number;
  address?: string;
}

export interface IEmploymentInfo {
  occupation?: string;
  employerName?: string;
  monthlyIncome?: number;
  sourceOfFunds?: string;
  taxId?: string;
}

export interface IAccountServices {
  debitCardRequested: boolean;
  chequeBookRequested: boolean;
  smsAlerts: boolean;
  eStatement: boolean;
}

export interface IKycSnapshot {
  docType?: string;
  docNumber?: string;
  verifiedViaOcr?: boolean;
  ocrConfidence?: number;
  docFrontUrl?: string;
  docBackUrl?: string;
}

export interface IBankAccount {
  _id: string;
  accountNumber: string;
  accountType: AccountType;
  status: AccountStatus;
  balance: number;
  availableBalance: number;
  currency: string;
  branchName?: string;
  routingNumber?: string;
  swiftBic?: string;
  iban?: string;
  userId: string | IUser;
  dailyTransferLimit: number;
  minimumBalance: number;
  nominee?: INominee;
  employmentInfo?: IEmploymentInfo;
  services?: IAccountServices;
  signatureUrl?: string;
  kycSnapshot?: IKycSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface ITransaction {
  _id: string;
  transactionId: string;
  senderAccount?: string | IBankAccount;
  receiverAccount?: string | IBankAccount;
  senderUserId?: string | IUser;
  receiverUserId?: string | IUser;
  type: TransactionType;
  amount: number;
  fee: number;
  status: TransactionStatus;
  description: string;
  reference?: string;
  isSuspicious: boolean;
  suspiciousReason?: string;
  reviewedBy?: string | IUser;
  createdAt: string;
  updatedAt: string;
}

export interface IDepositRequest {
  _id: string;
  accountId: string | IBankAccount;
  userId: string | IUser;
  amount: number;
  description: string;
  status: RequestStatus;
  reviewedBy?: string | IUser;
  reviewedAt?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IWithdrawalRequest {
  _id: string;
  accountId: string | IBankAccount;
  userId: string | IUser;
  amount: number;
  description: string;
  status: RequestStatus;
  reviewedBy?: string | IUser;
  reviewedAt?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILoanRepayment {
  _id: string;
  loanId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  transactionId?: string;
  createdAt: string;
}

export interface ILoan {
  _id: string;
  loanNumber: string;
  userId: string | IUser;
  accountId: string | IBankAccount;
  loanType: LoanType;
  amount: number;
  interestRate: number;
  durationMonths: number;
  monthlyRepayment: number;
  totalRepayment: number;
  remainingBalance: number;
  monthlyIncome: number;
  employmentStatus: string;
  purpose: string;
  status: LoanStatus;
  internalNotes?: string;
  forwardedToAdmin: boolean;
  reviewedBy?: string | IUser;
  approvedBy?: string | IUser;
  disbursedAt?: string;
  repayments: ILoanRepayment[];
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface IBankingSettings {
  _id: string;
  minimumAccountBalance: number;
  dailyTransferLimit: number;
  maximumTransactionAmount: number;
  transferFeePercentage: number;
  minTransferFee: number;
  suspiciousTransactionThreshold: number;
  rapidTransactionWindowMinutes: number;
  rapidTransactionCountLimit: number;
  loanInterestRateDefault: number;
  maxLoanDurationMonths: number;
  updatedBy?: string;
  updatedAt: string;
}

export interface IAuditLog {
  _id: string;
  userId?: string | IUser;
  userRole?: UserRole;
  action: string;
  category: "AUTH" | "TRANSACTION" | "ACCOUNT" | "LOAN" | "SETTINGS" | "CUSTOMER";
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface ICard {
  _id: string;
  userId: string | IUser;
  accountId: string | IBankAccount;
  cardNumber: string;
  maskedCardNumber: string;
  cardHolderName: string;
  cardType: CardType;
  network: CardNetwork;
  expiryMonth: number;
  expiryYear: number;
  cvv?: string;
  status: CardStatus;
  dailyOnlineLimit: number;
  dailyAtmLimit: number;
  dailyPosLimit: number;
  isOnlineEnabled: boolean;
  isAtmEnabled: boolean;
  isPosEnabled: boolean;
  isInternationalEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICardRequest {
  _id: string;
  userId: string | IUser;
  accountId: string | IBankAccount;
  requestType: CardRequestType;
  cardId?: string | ICard;
  cardType?: CardType;
  network?: CardNetwork;
  reason: string;
  status: RequestStatus;
  reviewedBy?: string | IUser;
  reviewedAt?: string;
  adminRemarks?: string;
  issuedCardId?: string | ICard;
  createdAt: string;
  updatedAt: string;
}

export interface IAccountClosureRequest {
  _id: string;
  userId: string | IUser;
  accountId: string | IBankAccount;
  reason: string;
  balance: number;
  targetPayoutAccount?: string;
  status: RequestStatus;
  reviewedBy?: string | IUser;
  reviewedAt?: string;
  adminRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPasskey {
  _id: string;
  credentialId: string;
  name: string;
  deviceType: "singleDevice" | "multiDevice";
  backedUp: boolean;
  transports: string[];
  lastUsedAt?: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
