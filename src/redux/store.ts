import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";
import authReducer from "./slices/authSlice";
import accountReducer from "./slices/accountSlice";
import transactionReducer from "./slices/transactionSlice";
import customerReducer from "./slices/customerSlice";
import loanReducer from "./slices/loanSlice";
import notificationReducer from "./slices/notificationSlice";
import dashboardReducer from "./slices/dashboardSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    account: accountReducer,
    transaction: transactionReducer,
    customer: customerReducer,
    loan: loanReducer,
    notification: notificationReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore date strings or non-serializable checks if needed
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
