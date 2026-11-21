import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ITransaction } from "@/types";

interface TransactionState {
  selectedTransaction: ITransaction | null;
  typeFilter: string;
  statusFilter: string;
  startDate: string | null;
  endDate: string | null;
  searchQuery: string;
  page: number;
  limit: number;
}

const initialState: TransactionState = {
  selectedTransaction: null,
  typeFilter: "ALL",
  statusFilter: "ALL",
  startDate: null,
  endDate: null,
  searchQuery: "",
  page: 1,
  limit: 10,
};

export const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setSelectedTransaction: (
      state,
      action: PayloadAction<ITransaction | null>
    ) => {
      state.selectedTransaction = action.payload;
    },
    setTypeFilter: (state, action: PayloadAction<string>) => {
      state.typeFilter = action.payload;
      state.page = 1;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setDateRange: (
      state,
      action: PayloadAction<{ startDate: string | null; endDate: string | null }>
    ) => {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
      state.page = 1;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
      state.page = 1;
    },
    resetTransactionFilters: (state) => {
      state.typeFilter = "ALL";
      state.statusFilter = "ALL";
      state.startDate = null;
      state.endDate = null;
      state.searchQuery = "";
      state.page = 1;
    },
  },
});

export const {
  setSelectedTransaction,
  setTypeFilter,
  setStatusFilter,
  setDateRange,
  setSearchQuery,
  setPage,
  setLimit,
  resetTransactionFilters,
} = transactionSlice.actions;

export default transactionSlice.reducer;
