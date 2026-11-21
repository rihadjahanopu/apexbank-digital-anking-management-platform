import { apiSlice } from "./apiSlice";
import { ICard, CardNetwork, CardType, CardStatus, ICardRequest, CardRequestType } from "@/types";

export const cardsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyCards: builder.query<{ success: boolean; cards: ICard[] }, void>({
      query: () => "/cards/my",
      providesTags: ["Card"],
    }),

    getAllCards: builder.query<
      {
        success: boolean;
        cards: ICard[];
        totalPages: number;
        currentPage: number;
        totalCards: number;
      },
      { search?: string; status?: string; network?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/cards",
        params,
      }),
      providesTags: ["Card"],
    }),

    getCardById: builder.query<
      { success: boolean; card: ICard },
      { id: string; reveal?: boolean; pin?: string }
    >({
      query: ({ id, reveal, pin }) => ({
        url: `/cards/${id}`,
        params: reveal ? { reveal: "true", pin } : {},
      }),
      providesTags: (_result, _error, { id }) => [{ type: "Card", id }],
    }),

    issueCard: builder.mutation<
      { success: boolean; message: string; card: ICard },
      {
        accountId: string;
        cardType?: CardType;
        network?: CardNetwork;
        pin: string;
      }
    >({
      query: (body) => ({
        url: "/cards/issue",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Card", "Account"],
    }),

    updateCardStatus: builder.mutation<
      { success: boolean; message: string; card: ICard },
      { id: string; status: CardStatus; reason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/cards/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Card"],
    }),

    updateCardControls: builder.mutation<
      { success: boolean; message: string; card: ICard },
      {
        id: string;
        dailyOnlineLimit?: number;
        dailyAtmLimit?: number;
        dailyPosLimit?: number;
        isOnlineEnabled?: boolean;
        isAtmEnabled?: boolean;
        isPosEnabled?: boolean;
        isInternationalEnabled?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/cards/${id}/controls`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Card"],
    }),

    changeCardPin: builder.mutation<
      { success: boolean; message: string },
      { id: string; currentPin?: string; newPin: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/cards/${id}/pin`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Card"],
    }),

    // Card Requests
    getMyCardRequests: builder.query<{ success: boolean; data: ICardRequest[] }, void>({
      query: () => "/cards/requests/my",
      providesTags: ["CardRequest"],
    }),

    getAllCardRequests: builder.query<
      {
        success: boolean;
        data: ICardRequest[];
        meta: { page: number; limit: number; total: number; totalPages: number };
      },
      { status?: string; requestType?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/cards/requests",
        params,
      }),
      providesTags: ["CardRequest"],
    }),

    requestCardAction: builder.mutation<
      { success: boolean; message: string; data: ICardRequest },
      {
        accountId: string;
        requestType: CardRequestType;
        cardId?: string;
        cardType?: CardType;
        network?: CardNetwork;
        reason: string;
      }
    >({
      query: (body) => ({
        url: "/cards/requests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CardRequest", "Card"],
    }),

    reviewCardRequest: builder.mutation<
      { success: boolean; message: string; data: ICardRequest },
      { id: string; action: "APPROVE" | "REJECT"; adminRemarks?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/cards/requests/${id}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CardRequest", "Card", "Account", "Notification"],
    }),
  }),
});

export const {
  useGetMyCardsQuery,
  useGetAllCardsQuery,
  useGetCardByIdQuery,
  useIssueCardMutation,
  useUpdateCardStatusMutation,
  useUpdateCardControlsMutation,
  useChangeCardPinMutation,
  useGetMyCardRequestsQuery,
  useGetAllCardRequestsQuery,
  useRequestCardActionMutation,
  useReviewCardRequestMutation,
} = cardsApi;
