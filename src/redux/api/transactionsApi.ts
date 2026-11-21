import { apiSlice } from "./apiSlice";
import {
  ITransaction,
  IDepositRequest,
  IWithdrawalRequest,
  ApiResponse,
} from "@/types";

export interface TransferFundsInput {
  senderAccountId: string;
  recipientAccountNumber: string;
  amount: number;
  description: string;
  transactionPin: string;
}

export interface DepositRequestInput {
  accountId: string;
  amount: number;
  description: string;
}

export interface WithdrawalRequestInput {
  accountId: string;
  amount: number;
  description: string;
}

export const transactionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<
      {
        success: boolean;
        transactions: ITransaction[];
        total: number;
        page: number;
        totalPages: number;
      },
      {
        page?: number;
        limit?: number;
        type?: string;
        status?: string;
        accountId?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (params) => ({
        url: "/transactions",
        params,
      }),
      providesTags: ["Transaction"],
    }),

    getTransactionById: builder.query<
      { success: boolean; transaction: ITransaction },
      string
    >({
      query: (id) => `/transactions/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Transaction", id }],
    }),

    transferFunds: builder.mutation<
      {
        success: boolean;
        message: string;
        transaction: ITransaction;
      },
      TransferFundsInput
    >({
      query: (body) => ({
        url: "/transactions/transfer",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Transaction", "Account", "Dashboard", "Notification"],
    }),

    requestDeposit: builder.mutation<
      ApiResponse,
      DepositRequestInput
    >({
      query: (body) => ({
        url: "/transactions/deposit-request",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DepositRequest", "Notification"],
    }),

    requestWithdrawal: builder.mutation<
      ApiResponse,
      WithdrawalRequestInput
    >({
      query: (body) => ({
        url: "/transactions/withdrawal-request",
        method: "POST",
        body,
      }),
      invalidatesTags: ["WithdrawalRequest", "Notification"],
    }),

    getDepositRequests: builder.query<
      {
        success: boolean;
        requests: IDepositRequest[];
        total: number;
        page: number;
        totalPages: number;
      },
      { page?: number; limit?: number; status?: string }
    >({
      query: (params) => ({
        url: "/transactions/deposit-requests",
        params,
      }),
      providesTags: ["DepositRequest"],
    }),

    getWithdrawalRequests: builder.query<
      {
        success: boolean;
        requests: IWithdrawalRequest[];
        total: number;
        page: number;
        totalPages: number;
      },
      { page?: number; limit?: number; status?: string }
    >({
      query: (params) => ({
        url: "/transactions/withdrawal-requests",
        params,
      }),
      providesTags: ["WithdrawalRequest"],
    }),

    reviewDepositRequest: builder.mutation<
      ApiResponse,
      { id: string; action: "APPROVE" | "REJECT"; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/transactions/deposit-requests/${id}/review`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "DepositRequest",
        "Transaction",
        "Account",
        "Dashboard",
      ],
    }),

    reviewWithdrawalRequest: builder.mutation<
      ApiResponse,
      { id: string; action: "APPROVE" | "REJECT"; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/transactions/withdrawal-requests/${id}/review`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "WithdrawalRequest",
        "Transaction",
        "Account",
        "Dashboard",
      ],
    }),

    getSuspiciousTransactions: builder.query<
      {
        success: boolean;
        transactions: ITransaction[];
        total: number;
      },
      void
    >({
      query: () => "/transactions/suspicious",
      providesTags: ["Transaction"],
    }),

    reviewSuspiciousTransaction: builder.mutation<
      ApiResponse,
      { id: string; action: "DISMISS" | "BLOCK_ACCOUNT" }
    >({
      query: ({ id, ...body }) => ({
        url: `/transactions/suspicious/${id}/review`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Transaction", "Account", "Dashboard"],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useTransferFundsMutation,
  useRequestDepositMutation,
  useRequestWithdrawalMutation,
  useGetDepositRequestsQuery,
  useGetWithdrawalRequestsQuery,
  useReviewDepositRequestMutation,
  useReviewWithdrawalRequestMutation,
  useGetSuspiciousTransactionsQuery,
  useReviewSuspiciousTransactionMutation,
} = transactionsApi;
