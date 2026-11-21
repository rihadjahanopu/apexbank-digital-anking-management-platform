import { apiSlice } from "./apiSlice";
import { IUser, IBankAccount, ITransaction, ApiResponse } from "@/types";

export interface RegisterCustomerByStaffInput {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  nationalId?: string;
  address?: string;
  initialAccountType?: string;
  initialDeposit?: number;
}

export const customersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<
      {
        success: boolean;
        customers: IUser[];
        total: number;
        page: number;
        totalPages: number;
      },
      {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
      }
    >({
      query: (params) => ({
        url: "/customers",
        params,
      }),
      providesTags: ["Customer"],
    }),

    getCustomerById: builder.query<
      {
        success: boolean;
        customer: IUser;
        accounts: IBankAccount[];
        transactions: ITransaction[];
      },
      string
    >({
      query: (id) => `/customers/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Customer", id }],
    }),

    registerCustomerByStaff: builder.mutation<
      { success: boolean; message: string; customer: IUser },
      RegisterCustomerByStaffInput
    >({
      query: (body) => ({
        url: "/customers",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Customer", "Account", "Dashboard"],
    }),

    updateCustomerStatus: builder.mutation<
      ApiResponse,
      { id: string; status: string; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/customers/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Customer", "Account", "Dashboard"],
    }),

    verifyCustomerKyc: builder.mutation<
      ApiResponse,
      { id: string; isVerified: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/customers/${id}/verify`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Customer", "Dashboard"],
    }),

    changeCustomerRole: builder.mutation<
      ApiResponse,
      { id: string; role: string; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/role`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Customer", "Staff", "Dashboard"],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useRegisterCustomerByStaffMutation,
  useUpdateCustomerStatusMutation,
  useVerifyCustomerKycMutation,
  useChangeCustomerRoleMutation,
} = customersApi;
