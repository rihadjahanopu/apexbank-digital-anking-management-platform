import { apiSlice } from "./apiSlice";
import { ITransaction, IBankAccount, ILoan } from "@/types";

export interface AdminDashboardData {
  totalCustomers: number;
  totalBankAccounts: number;
  totalBankBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTransactions: number;
  pendingDepositRequests: number;
  pendingWithdrawalRequests: number;
  pendingLoanApplications: number;
  activeLoans: number;
  suspiciousTransactions: number;
  monthlyVolume: { month: string; volume: number; count: number }[];
  depositsVsWithdrawals: {
    month: string;
    deposits: number;
    withdrawals: number;
  }[];
  accountDistribution: { name: string; value: number }[];
}

export interface StaffDashboardData {
  pendingVerifications: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingLoans: number;
  totalCustomersAssigned: number;
  recentTransactions: ITransaction[];
}

export interface CustomerDashboardData {
  totalBalance: number;
  availableBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  accounts: IBankAccount[];
  recentTransactions: ITransaction[];
  activeLoans: ILoan[];
  monthlyActivity: {
    month: string;
    moneyIn: number;
    moneyOut: number;
  }[];
}

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query<
      { success: boolean; data: AdminDashboardData },
      void
    >({
      query: () => "/dashboard/admin",
      providesTags: ["Dashboard"],
    }),

    getStaffDashboard: builder.query<
      { success: boolean; data: StaffDashboardData },
      void
    >({
      query: () => "/dashboard/staff",
      providesTags: ["Dashboard"],
    }),

    getCustomerDashboard: builder.query<
      { success: boolean; data: CustomerDashboardData },
      void
    >({
      query: () => "/dashboard/customer",
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetStaffDashboardQuery,
  useGetCustomerDashboardQuery,
} = dashboardApi;
