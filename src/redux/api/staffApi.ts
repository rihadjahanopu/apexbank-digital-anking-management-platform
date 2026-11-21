import { apiSlice } from "./apiSlice";
import { IUser, ApiResponse, UserStatus, UserRole } from "@/types";

export interface CreateStaffInput {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  nationalId?: string;
  address?: string;
  role?: UserRole;
}

export interface StaffStats {
  total: number;
  admins: number;
  active: number;
  inactive: number;
  blocked: number;
}

export interface GetStaffListResponse {
  success: boolean;
  staff: IUser[];
  stats: StaffStats;
}

export const staffApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStaffList: builder.query<
      GetStaffListResponse,
      { search?: string; status?: string; role?: string } | void
    >({
      query: (params) => ({
        url: "/staff",
        params: params || undefined,
      }),
      providesTags: ["Staff"],
    }),

    createStaff: builder.mutation<
      { success: boolean; message: string; staff: IUser },
      CreateStaffInput
    >({
      query: (body) => ({
        url: "/staff",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Staff", "Dashboard"],
    }),

    updateStaffStatus: builder.mutation<
      ApiResponse,
      { id: string; status: UserStatus; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/staff/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Staff", "Dashboard"],
    }),

    changeUserRole: builder.mutation<
      ApiResponse,
      { id: string; role: UserRole; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/role`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Staff", "Customer", "Dashboard"],
    }),

    updateStaff: builder.mutation<
      ApiResponse,
      {
        id: string;
        name?: string;
        phone?: string;
        address?: string;
        nationalId?: string;
        newPassword?: string;
        role?: UserRole;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/staff/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Staff", "Dashboard"],
    }),

    deleteStaff: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff", "Dashboard"],
    }),
  }),
});

export const {
  useGetStaffListQuery,
  useCreateStaffMutation,
  useUpdateStaffStatusMutation,
  useChangeUserRoleMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} = staffApi;
