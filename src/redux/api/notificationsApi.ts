import { apiSlice } from "./apiSlice";
import { INotification, ApiResponse } from "@/types";

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      {
        success: boolean;
        notifications: INotification[];
        unreadCount: number;
      },
      void
    >({
      query: () => "/notifications",
      providesTags: ["Notification"],
    }),

    markNotificationRead: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: "/notifications",
        method: "PATCH",
        body: { id },
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsRead: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: "/notifications",
        method: "PATCH",
        body: { markAll: true },
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi;
