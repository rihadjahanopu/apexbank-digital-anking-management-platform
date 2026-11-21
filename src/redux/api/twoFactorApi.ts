import { apiSlice } from "./apiSlice";
import { IUser } from "@/types";

export const twoFactorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    generate2fa: builder.mutation<
      { success: boolean; secret: string; qrCodeDataUrl: string },
      void
    >({
      query: () => ({
        url: "/auth/2fa/generate",
        method: "POST",
      }),
    }),

    verify2fa: builder.mutation<
      { success: boolean; message: string },
      { token: string; secret: string }
    >({
      query: (body) => ({
        url: "/auth/2fa/verify",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    disable2fa: builder.mutation<
      { success: boolean; message: string },
      { password: string; token: string }
    >({
      query: (body) => ({
        url: "/auth/2fa/disable",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),

    login2fa: builder.mutation<
      {
        success: boolean;
        message: string;
        token: string;
        user: IUser;
      },
      { tempToken: string; token: string }
    >({
      query: (body) => ({
        url: "/auth/2fa/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const {
  useGenerate2faMutation,
  useVerify2faMutation,
  useDisable2faMutation,
  useLogin2faMutation,
} = twoFactorApi;
