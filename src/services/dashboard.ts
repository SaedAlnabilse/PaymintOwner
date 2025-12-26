import { apiClient } from './apiClient';

// Backend response structure
export interface DashboardMetrics {
  netSales: number;
  numberOfOrders: number;
  cashSales: number;
  cardSales: number;
  otherPayments: number;
  drawerAmount: number;
  payIn: number;
  payOut: number;
  totalTimeWorked: string;
  shiftStatus: 'ACTIVE' | 'LAST_SHIFT' | 'NO_SHIFT' | 'CLOSED';
}

export interface DashboardSummary {
  // This matches the structure when calling /reports/live-shift which returns the metrics object directly
  // or when it's nested in OwnerDashboard
  type?: 'CURRENT_SHIFT' | 'LAST_SHIFT' | 'NO_SHIFT';
  shiftStatus?: 'ACTIVE' | 'LAST_SHIFT' | 'NO_SHIFT' | 'CLOSED';
  shift?: any;
  // properties from backend
  netSales?: number;
  numberOfOrders?: number;
  cashSales?: number;
  cardSales?: number;
  otherPayments?: number;
  drawerAmount?: number;
  payIn?: number;
  payOut?: number;
  totalTimeWorked?: string;
  // Legacy support if needed, but backend sends above
  metrics?: DashboardMetrics;
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
  metrics: DashboardMetrics;
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
    netSales: 0,
    numberOfOrders: 0,
    cashSales: 0,
    cardSales: 0,
    otherPayments: 0,
    drawerAmount: 0,
    payIn: 0,
    payOut: 0,
    totalTimeWorked: '0 minutes',
    shiftStatus: 'CLOSED'
  }
});

const getDefaultOwnerDashboard = (): OwnerDashboard => ({
  metrics: {
    netSales: 0,
    numberOfOrders: 0,
    cashSales: 0,
    cardSales: 0,
    otherPayments: 0,
    drawerAmount: 0,
    payIn: 0,
    payOut: 0,
    totalTimeWorked: '0 minutes',
    shiftStatus: 'CLOSED'
  },
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
