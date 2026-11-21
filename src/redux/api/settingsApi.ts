import { apiSlice } from "./apiSlice";
import { IBankingSettings, ApiResponse } from "@/types";

export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<
      { success: boolean; settings: IBankingSettings },
      void
    >({
      query: () => "/settings",
      providesTags: ["Settings"],
    }),

    updateSettings: builder.mutation<ApiResponse, Partial<IBankingSettings>>({
      query: (body) => ({
        url: "/settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
