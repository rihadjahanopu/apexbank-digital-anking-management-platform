import { apiSlice } from "./apiSlice";
import { ILoan, ApiResponse } from "@/types";

export interface ApplyLoanInput {
  accountId: string;
  loanType: string;
  amount: number;
  durationMonths: number;
  monthlyIncome: number;
  employmentStatus: string;
  purpose: string;
}

export const loansApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLoans: builder.query<
      {
        success: boolean;
        loans: ILoan[];
        total: number;
        page: number;
        totalPages: number;
      },
      {
        page?: number;
        limit?: number;
        status?: string;
        type?: string;
        search?: string;
      }
    >({
      query: (params) => ({
        url: "/loans",
        params,
      }),
      providesTags: ["Loan"],
    }),

    getMyLoans: builder.query<{ success: boolean; loans: ILoan[] }, void>({
      query: () => "/loans/my",
      providesTags: ["Loan"],
    }),

    getLoanById: builder.query<{ success: boolean; loan: ILoan }, string>({
      query: (id) => `/loans/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Loan", id }],
    }),

    applyLoan: builder.mutation<
      { success: boolean; message: string; loan: ILoan },
      ApplyLoanInput
    >({
      query: (body) => ({
        url: "/loans",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loan", "Notification", "Dashboard"],
    }),

    addInternalNote: builder.mutation<
      ApiResponse,
      { id: string; note: string; forwardToAdmin?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/loans/${id}/note`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loan"],
    }),

    reviewLoan: builder.mutation<
      ApiResponse,
      { id: string; action: "FORWARD_ADMIN" | "REJECT"; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/loans/${id}/review`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loan", "Dashboard"],
    }),

    approveLoan: builder.mutation<
      ApiResponse,
      { id: string; approvedRate?: number; note?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/loans/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loan", "Account", "Transaction", "Dashboard"],
    }),

    rejectLoan: builder.mutation<
      ApiResponse,
      { id: string; reason: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/loans/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loan", "Dashboard"],
    }),

    repayLoanInstallment: builder.mutation<
      ApiResponse,
      { loanId: string; installmentNumber: number; accountId: string }
    >({
      query: ({ loanId, ...body }) => ({
        url: `/loans/${loanId}/repay`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loan", "Account", "Transaction", "Dashboard"],
    }),
  }),
});

export const {
  useGetLoansQuery,
  useGetMyLoansQuery,
  useGetLoanByIdQuery,
  useApplyLoanMutation,
  useAddInternalNoteMutation,
  useReviewLoanMutation,
  useApproveLoanMutation,
  useRejectLoanMutation,
  useRepayLoanInstallmentMutation,
} = loansApi;
