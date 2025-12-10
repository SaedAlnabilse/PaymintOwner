import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getSalesSummary as getSalesSummaryAPI,
  getTopSellingItems as getTopSellingItemsAPI,
  getLiveShiftReport as getLiveShiftReportAPI,
} from '../../services/reports';
import { HistoricalSummary, TopSellingItem, LiveShiftReport } from '../../types/reports';

interface ReportsState {
  historicalSummary: {
    data: HistoricalSummary | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
  topSellingItems: {
    data: TopSellingItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
  liveShift: {
    data: LiveShiftReport | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
}

const initialState: ReportsState = {
  historicalSummary: {
    data: null,
    status: 'idle',
    error: null,
  },
  topSellingItems: {
    data: [],
    status: 'idle',
    error: null,
  },
  liveShift: {
    data: null,
    status: 'idle',
    error: null,
  },
};

interface FetchParams {
  startDate: string;
  endDate: string;
  employeeId?: string;
}

export const fetchHistoricalSummary = createAsyncThunk<HistoricalSummary, FetchParams>(
  'reports/fetchHistoricalSummary',
  async ({ startDate, endDate, employeeId }, { rejectWithValue }) => {
    try {
      const summary = await getSalesSummaryAPI(startDate, endDate, employeeId);
      return summary;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchTopSellingItems = createAsyncThunk<TopSellingItem[], FetchParams>(
  'reports/fetchTopSellingItems',
  async ({ startDate, endDate, employeeId }, { rejectWithValue }) => {
    try {
      const items = await getTopSellingItemsAPI(startDate, endDate, employeeId);
      return items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchLiveShiftReport = createAsyncThunk<LiveShiftReport>(
  'reports/fetchLiveShiftReport',
  async (_, { rejectWithValue }) => {
    try {
      const report = await getLiveShiftReportAPI();
      return report;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Historical Summary
      .addCase(fetchHistoricalSummary.pending, (state) => {
        state.historicalSummary.status = 'loading';
      })
      .addCase(fetchHistoricalSummary.fulfilled, (state, action: PayloadAction<HistoricalSummary>) => {
        state.historicalSummary.status = 'succeeded';
        state.historicalSummary.data = action.payload;
      })
      .addCase(fetchHistoricalSummary.rejected, (state, action) => {
        state.historicalSummary.status = 'failed';
        state.historicalSummary.error = action.payload as string;
      })
      // Top Selling Items
      .addCase(fetchTopSellingItems.pending, (state) => {
        state.topSellingItems.status = 'loading';
      })
      .addCase(fetchTopSellingItems.fulfilled, (state, action: PayloadAction<TopSellingItem[]>) => {
        state.topSellingItems.status = 'succeeded';
        state.topSellingItems.data = action.payload;
      })
      .addCase(fetchTopSellingItems.rejected, (state, action) => {
        state.topSellingItems.status = 'failed';
        state.topSellingItems.error = action.payload as string;
      })
      // Live Shift Report
      .addCase(fetchLiveShiftReport.pending, (state) => {
        state.liveShift.status = 'loading';
      })
      .addCase(fetchLiveShiftReport.fulfilled, (state, action: PayloadAction<LiveShiftReport>) => {
        state.liveShift.status = 'succeeded';
        state.liveShift.data = action.payload;
      })
      .addCase(fetchLiveShiftReport.rejected, (state, action) => {
        state.liveShift.status = 'failed';
        state.liveShift.error = action.payload as string;
      });
  },
});

export default reportsSlice.reducer;