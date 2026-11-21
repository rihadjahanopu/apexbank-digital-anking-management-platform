import { apiSlice } from "./apiSlice";
import { IUser, ApiResponse, IPasskey } from "@/types";
import {
  LoginInput,
  RegisterInput,
  ChangePasswordInput,
  SetPinInput,
  UpdateProfileInput,
} from "@/lib/validations/auth";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<{ success: boolean; user: IUser }, void>({
      query: () => "/auth/me",
      providesTags: ["Auth"],
    }),

    login: builder.mutation<
      { success: boolean; message: string; user: IUser; token: string },
      LoginInput
    >({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "Account", "Dashboard"],
    }),

    register: builder.mutation<
      { success: boolean; message: string; user: IUser; token: string },
      RegisterInput
    >({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth", "Customer"],
    }),

    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    changePassword: builder.mutation<ApiResponse, ChangePasswordInput>({
      query: (data) => ({
        url: "/auth/change-password",
        method: "POST",
        body: data,
      }),
    }),

    setPin: builder.mutation<ApiResponse, SetPinInput>({
      query: (data) => ({
        url: "/auth/set-pin",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),

    updateProfile: builder.mutation<
      { success: boolean; message: string; user: IUser },
      UpdateProfileInput
    >({
      query: (data) => ({
        url: "/auth/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),

    getMyPasskeys: builder.query<{ success: boolean; passkeys: IPasskey[] }, void>({
      query: () => "/auth/passkey/my",
      providesTags: ["Passkey"],
    }),

    deletePasskey: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/auth/passkey/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Passkey"],
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useSetPinMutation,
  useUpdateProfileMutation,
  useGetMyPasskeysQuery,
  useDeletePasskeyMutation,
} = authApi;
