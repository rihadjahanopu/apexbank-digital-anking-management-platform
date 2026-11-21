import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DashboardState {
  timeRange: "7D" | "30D" | "90D" | "1Y" | "ALL";
  chartMetric: "volume" | "deposits_withdrawals" | "loans";
}

const initialState: DashboardState = {
  timeRange: "30D",
  chartMetric: "volume",
};

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setTimeRange: (
      state,
      action: PayloadAction<"7D" | "30D" | "90D" | "1Y" | "ALL">
    ) => {
      state.timeRange = action.payload;
    },
    setChartMetric: (
      state,
      action: PayloadAction<"volume" | "deposits_withdrawals" | "loans">
    ) => {
      state.chartMetric = action.payload;
    },
  },
});

export const { setTimeRange, setChartMetric } = dashboardSlice.actions;

export default dashboardSlice.reducer;
