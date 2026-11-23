import { apiSlice } from "./apiSlice";
import { IBankAccount, ApiResponse, IAccountClosureRequest } from "@/types";

export interface CreateAccountInput {
  userId?: string;
  isNewCustomer?: boolean;
  newCustomerData?: {
    name: string;
    email: string;
    phone?: string;
    nationalId?: string;
    address?: string;
    password?: string;
  };
  accountType: string;
  currency?: string;
  branchName?: string;
  initialDeposit?: number;
  dailyTransferLimit?: number;
  minimumBalance?: number;
  nominee?: {
    name: string;
    relation: string;
    phone?: string;
    nationalId?: string;
    sharePercent?: number;
    address?: string;
  };
  employmentInfo?: {
    occupation?: string;
    employerName?: string;
    monthlyIncome?: number;
    sourceOfFunds?: string;
    taxId?: string;
  };
  services?: {
    debitCardRequested?: boolean;
    chequeBookRequested?: boolean;
    smsAlerts?: boolean;
    eStatement?: boolean;
  };
  signatureUrl?: string;
  kycSnapshot?: {
    docType?: string;
    docNumber?: string;
    verifiedViaOcr?: boolean;
    ocrConfidence?: number;
    docFrontUrl?: string;
    docBackUrl?: string;
  };
}

export const accountsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyAccounts: builder.query<
      { success: boolean; accounts: IBankAccount[] },
      void
    >({
      query: () => "/accounts/my",
      providesTags: ["Account"],
    }),

    getAccounts: builder.query<
      {
        success: boolean;
        accounts: IBankAccount[];
        total: number;
        page: number;
        totalPages: number;
      },
      {
        page?: number;
        limit?: number;
        type?: string;
        status?: string;
        search?: string;
        userId?: string;
      }
    >({
      query: (params) => ({
        url: "/accounts",
        params,
      }),
      providesTags: ["Account"],
    }),

    getAccountById: builder.query<
      { success: boolean; account: IBankAccount },
      string
    >({
      query: (id) => `/accounts/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Account", id }],
    }),

    createAccount: builder.mutation<
      { success: boolean; message: string; account: IBankAccount },
      CreateAccountInput
    >({
      query: (data) => ({
        url: "/accounts",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Account", "Customer", "Dashboard", "Auth"],
    }),

    updateAccountStatus: builder.mutation<
      ApiResponse,
      { id: string; status: string; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounts/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Account", "Dashboard"],
    }),

    updateAccountLimits: builder.mutation<
      ApiResponse,
      { id: string; dailyTransferLimit?: number; minimumBalance?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounts/${id}/limits`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Account"],
    }),

    // Account Closure Requests
    getMyClosureRequests: builder.query<
      { success: boolean; data: IAccountClosureRequest[] },
      void
    >({
      query: () => "/accounts/closure-requests/my",
      providesTags: ["AccountClosureRequest"],
    }),

    getAllClosureRequests: builder.query<
      {
        success: boolean;
        data: IAccountClosureRequest[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/accounts/closure-requests",
        params,
      }),
      providesTags: ["AccountClosureRequest"],
    }),

    requestAccountClosure: builder.mutation<
      { success: boolean; message: string; data: IAccountClosureRequest },
      { accountId: string; reason: string; targetPayoutAccount?: string }
    >({
      query: (body) => ({
        url: "/accounts/closure-requests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccountClosureRequest", "Account"],
    }),

    reviewAccountClosure: builder.mutation<
      { success: boolean; message: string; data: IAccountClosureRequest },
      { id: string; action: "APPROVE" | "REJECT"; adminRemarks?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/accounts/closure-requests/${id}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AccountClosureRequest", "Account", "Card", "Notification"],
    }),
  }),
});

export const {
  useGetMyAccountsQuery,
  useGetAccountsQuery,
  useGetAccountByIdQuery,
  useCreateAccountMutation,
  useUpdateAccountStatusMutation,
  useUpdateAccountLimitsMutation,
  useGetMyClosureRequestsQuery,
  useGetAllClosureRequestsQuery,
  useRequestAccountClosureMutation,
  useReviewAccountClosureMutation,
} = accountsApi;
