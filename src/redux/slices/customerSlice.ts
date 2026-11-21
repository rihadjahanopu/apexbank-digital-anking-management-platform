import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUser } from "@/types";

interface CustomerState {
  selectedCustomer: IUser | null;
  searchQuery: string;
  statusFilter: string;
  page: number;
  limit: number;
}

const initialState: CustomerState = {
  selectedCustomer: null,
  searchQuery: "",
  statusFilter: "ALL",
  page: 1,
  limit: 10,
};

export const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setSelectedCustomer: (state, action: PayloadAction<IUser | null>) => {
      state.selectedCustomer = action.payload;
    },
    setCustomerSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setCustomerStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setCustomerPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    resetCustomerFilters: (state) => {
      state.searchQuery = "";
      state.statusFilter = "ALL";
      state.page = 1;
    },
  },
});

export const {
  setSelectedCustomer,
  setCustomerSearchQuery,
  setCustomerStatusFilter,
  setCustomerPage,
  resetCustomerFilters,
} = customerSlice.actions;

export default customerSlice.reducer;
