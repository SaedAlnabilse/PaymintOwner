import { apiClient } from './apiClient';

export interface DashboardSummary {
  type?: 'CURRENT_SHIFT' | 'LAST_SHIFT' | 'NO_SHIFT';
  shiftStatus?: 'ACTIVE' | 'LAST_SHIFT' | 'NO_SHIFT' | 'CLOSED';
  shift?: any;
  metrics: {
    totalSales: number;
    cashSales: number;
    cardSales: number;
    otherSales: number;
    orderCount: number;
    totalPayIn: number;
    totalPayOut: number;
    // Other metrics as needed
  };
}

// Default empty response when API fails
const getDefaultDashboardSummary = (): DashboardSummary => ({
  type: 'NO_SHIFT',
  shiftStatus: 'CLOSED',
  metrics: {
    totalSales: 0,
    cashSales: 0,
    cardSales: 0,
    otherSales: 0,
    orderCount: 0,
    totalPayIn: 0,
    totalPayOut: 0,
  },
});

export const getDashboardSummary = async (retryCount = 0): Promise<DashboardSummary> => {
  try {
    // The backend controller is mapped to /reports/live-shift for dashboard data
    // Auth token in apiClient headers handles user identification
    const response = await apiClient.get('/reports/live-shift');
    return response.data;
  } catch (error: any) {
    // Handle rate limiting (429) with retry
    if (error?.response?.status === 429 && retryCount < 3) {
      console.warn(`Rate limited (429), retrying in ${(retryCount + 1) * 2} seconds...`);
      await new Promise<void>(resolve => setTimeout(() => resolve(), (retryCount + 1) * 2000));
      return getDashboardSummary(retryCount + 1);
    }

    console.error('Failed to fetch dashboard summary:', error?.message || error);

    // Return default response instead of throwing to prevent app crash
    return getDefaultDashboardSummary();
  }
};
