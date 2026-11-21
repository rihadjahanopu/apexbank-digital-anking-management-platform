import { apiSlice } from "./apiSlice";
import { IAuditLog } from "@/types";

export const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<
      {
        success: boolean;
        logs: IAuditLog[];
        total: number;
        page: number;
        totalPages: number;
      },
      { page?: number; limit?: number; category?: string }
    >({
      query: (params) => ({
        url: "/audit-logs",
        params,
      }),
      providesTags: ["AuditLog"],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditApi;
