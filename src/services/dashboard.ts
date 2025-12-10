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
  };
}

export interface StaffMember {
  id: string;
  name: string;
  username: string;
  role: string;
  initials: string;
  status: 'Clocked In' | 'Clocked Out';
  isClockedIn: boolean;
  shiftStartTime: string | null;
  todaySales: number;
  todayCashSales: number;
  todayCardSales: number;
  todayOrderCount: number;
  todayHours: number;
}

export interface StaffOverview {
  staff: StaffMember[];
  summary: {
    totalStaff: number;
    clockedIn: number;
    clockedOut: number;
  };
  generatedAt: string;
}

export interface OwnerDashboard {
  metrics: DashboardSummary;
  storeStatus: 'OPEN' | 'CLOSED';
  cashAlerts: {
    unreadCount: number;
    recent: Array<{
      id: string;
      title: string;
      message: string;
      isRead: boolean;
      createdAt: string;
    }>;
  };
  staff: {
    totalStaff: number;
    clockedIn: number;
    clockedOut: number;
  };
  generatedAt: string;
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

const getDefaultOwnerDashboard = (): OwnerDashboard => ({
  metrics: getDefaultDashboardSummary(),
  storeStatus: 'CLOSED',
  cashAlerts: { unreadCount: 0, recent: [] },
  staff: { totalStaff: 0, clockedIn: 0, clockedOut: 0 },
  generatedAt: new Date().toISOString(),
});

const getDefaultStaffOverview = (): StaffOverview => ({
  staff: [],
  summary: { totalStaff: 0, clockedIn: 0, clockedOut: 0 },
  generatedAt: new Date().toISOString(),
});

/**
 * OPTIMIZED: Get owner dashboard data in a single API call
 * Includes metrics, store status, cash alerts, and staff summary
 */
export const getOwnerDashboard = async (retryCount = 0): Promise<OwnerDashboard> => {
  try {
    const response = await apiClient.get('/reports/owner-dashboard');
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 429 && retryCount < 3) {
      console.warn(`Rate limited (429), retrying in ${(retryCount + 1) * 2} seconds...`);
      await new Promise<void>(resolve => setTimeout(() => resolve(), (retryCount + 1) * 2000));
      return getOwnerDashboard(retryCount + 1);
    }
    console.error('Failed to fetch owner dashboard:', error?.message || error);
    return getDefaultOwnerDashboard();
  }
};

/**
 * OPTIMIZED: Get all staff data in a single API call
 * Includes shift status, today's sales, and hours for all users
 */
export const getStaffOverview = async (retryCount = 0): Promise<StaffOverview> => {
  try {
    const response = await apiClient.get('/reports/staff-overview');
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 429 && retryCount < 3) {
      console.warn(`Rate limited (429), retrying in ${(retryCount + 1) * 2} seconds...`);
      await new Promise<void>(resolve => setTimeout(() => resolve(), (retryCount + 1) * 2000));
      return getStaffOverview(retryCount + 1);
    }
    console.error('Failed to fetch staff overview:', error?.message || error);
    return getDefaultStaffOverview();
  }
};

/**
 * Legacy: Get dashboard summary (kept for backward compatibility)
 */
export const getDashboardSummary = async (retryCount = 0): Promise<DashboardSummary> => {
  try {
    const response = await apiClient.get('/reports/live-shift');
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 429 && retryCount < 3) {
      console.warn(`Rate limited (429), retrying in ${(retryCount + 1) * 2} seconds...`);
      await new Promise<void>(resolve => setTimeout(() => resolve(), (retryCount + 1) * 2000));
      return getDashboardSummary(retryCount + 1);
    }
    console.error('Failed to fetch dashboard summary:', error?.message || error);
    return getDefaultDashboardSummary();
  }
};
