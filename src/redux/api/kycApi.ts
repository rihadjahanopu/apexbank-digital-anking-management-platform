import { apiSlice } from "./apiSlice";
import { IKycDocument, KycDocumentType, KycStatus, IUser } from "@/types";

export const kycApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyKyc: builder.query<
      { success: boolean; isVerified: boolean; kycDocuments: IKycDocument[] },
      void
    >({
      query: () => "/kyc/my",
      providesTags: ["KYC"],
    }),

    getAllKyc: builder.query<
      { success: boolean; customers: IUser[] },
      { status?: string }
    >({
      query: (params) => ({
        url: "/kyc",
        params,
      }),
      providesTags: ["KYC"],
    }),

    submitKyc: builder.mutation<
      { success: boolean; message: string; kycDocuments: IKycDocument[] },
      { docType: KycDocumentType; docNumber: string; docUrl: string }
    >({
      query: (body) => ({
        url: "/kyc/submit",
        method: "POST",
        body,
      }),
      invalidatesTags: ["KYC", "Auth"],
    }),

    reviewKyc: builder.mutation<
      { success: boolean; message: string; user: IUser },
      { id: string; docId: string; status: KycStatus; remarks?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/kyc/${id}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["KYC", "Customer"],
    }),
  }),
});

export const {
  useGetMyKycQuery,
  useGetAllKycQuery,
  useSubmitKycMutation,
  useReviewKycMutation,
} = kycApi;
