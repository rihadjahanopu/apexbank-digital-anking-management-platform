import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ILoan } from "@/types";

interface LoanState {
  selectedLoan: ILoan | null;
  statusFilter: string;
  typeFilter: string;
  searchQuery: string;
  page: number;
  limit: number;
}

const initialState: LoanState = {
  selectedLoan: null,
  statusFilter: "ALL",
  typeFilter: "ALL",
  searchQuery: "",
  page: 1,
  limit: 10,
};

export const loanSlice = createSlice({
  name: "loan",
  initialState,
  reducers: {
    setSelectedLoan: (state, action: PayloadAction<ILoan | null>) => {
      state.selectedLoan = action.payload;
    },
    setLoanStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setLoanTypeFilter: (state, action: PayloadAction<string>) => {
      state.typeFilter = action.payload;
      state.page = 1;
    },
    setLoanSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setLoanPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    resetLoanFilters: (state) => {
      state.statusFilter = "ALL";
      state.typeFilter = "ALL";
      state.searchQuery = "";
      state.page = 1;
    },
  },
});

export const {
  setSelectedLoan,
  setLoanStatusFilter,
  setLoanTypeFilter,
  setLoanSearchQuery,
  setLoanPage,
  resetLoanFilters,
} = loanSlice.actions;

export default loanSlice.reducer;
