import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IBankAccount } from "@/types";

interface AccountState {
  selectedAccountId: string | null;
  selectedAccount: IBankAccount | null;
  accountTypeFilter: string;
  statusFilter: string;
  searchQuery: string;
}

const initialState: AccountState = {
  selectedAccountId: null,
  selectedAccount: null,
  accountTypeFilter: "ALL",
  statusFilter: "ALL",
  searchQuery: "",
};

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setSelectedAccount: (state, action: PayloadAction<IBankAccount | null>) => {
      state.selectedAccount = action.payload;
      state.selectedAccountId = action.payload ? action.payload._id : null;
    },
    setSelectedAccountId: (state, action: PayloadAction<string | null>) => {
      state.selectedAccountId = action.payload;
    },
    setAccountTypeFilter: (state, action: PayloadAction<string>) => {
      state.accountTypeFilter = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    resetAccountFilters: (state) => {
      state.accountTypeFilter = "ALL";
      state.statusFilter = "ALL";
      state.searchQuery = "";
    },
  },
});

export const {
  setSelectedAccount,
  setSelectedAccountId,
  setAccountTypeFilter,
  setStatusFilter,
  setSearchQuery,
  resetAccountFilters,
} = accountSlice.actions;

export default accountSlice.reducer;
