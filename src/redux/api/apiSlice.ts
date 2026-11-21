import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * RTK Query Base API Slice
 * Centralizes API communication, headers configuration, and cache invalidation tags.
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      // If token is stored in localStorage or cookies, headers can be enhanced here
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: [
    "Auth",
    "Account",
    "Transaction",
    "Customer",
    "Loan",
    "Notification",
    "Dashboard",
    "Settings",
    "AuditLog",
    "DepositRequest",
    "WithdrawalRequest",
    "Card",
    "KYC",
    "CardRequest",
    "AccountClosureRequest",
    "Passkey",
    "Staff",
  ],
  endpoints: () => ({}),
});
