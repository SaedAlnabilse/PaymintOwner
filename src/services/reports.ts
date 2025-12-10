import { apiClient } from './apiClient';
import {
  TopSellingItem,
  Employee,
  OrderHistoryItem,
  OrderHistoryFilters,
  LiveShiftReport,
  HistoricalSummary,
  HistoricalOrder,
  PayInPayOutLogResponse,
  ShiftSummary,
  OrderDetails,
} from '../types/reports';

export const getSalesSummary = async (
  startDate: string,
  endDate: string,
  employeeId?: string,
): Promise<HistoricalSummary> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (employeeId) {
    params.append('employeeId', employeeId);
  }

  console.log('🔌 API: Calling /reports/historical-summary with params:', params.toString());
  try {
    const response = await apiClient.get(
      `/reports/historical-summary?${params.toString()}`,
    );
    console.log('✅ API: Historical summary response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('❌ API: Historical summary error:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchOrdersHistory = async (
  startDate: string,
  endDate: string,
  options: {
    employeeId?: string;
    page?: number;
    limit?: number;
    status?: string;
  } = {},
): Promise<HistoricalOrder[]> => {
  const { employeeId, page, limit, status } = options;
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (employeeId) params.append('employeeId', employeeId);
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (status) params.append('status', status);

  const fullUrl = `/reports/orders-history?${params.toString()}`;
  console.log('🌐 Orders API Call:', fullUrl);
  console.log('🌐 Orders API params:', {
    startDate,
    endDate,
    employeeId,
    page,
    limit,
    status,
  });

  const response = await apiClient.get(fullUrl);
  return response.data;
};

export const getTopSellingItems = async (
  startDate: string,
  endDate: string,
  employeeId?: string,
): Promise<TopSellingItem[]> => {
  const params = new URLSearchParams();
  params.append('startDate', startDate);
  params.append('endDate', endDate);
  if (employeeId) params.append('employeeId', employeeId);

  console.log('🔌 API: Calling /reports/top-selling-items with params:', params.toString());
  try {
    const response = await apiClient.get(
      `/reports/top-selling-items?${params.toString()}`,
    );
    console.log('✅ API: Top selling items response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('❌ API: Top selling items error:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get('/reports/employees');
  return response.data;
};

export const getLiveShiftReport = async (employeeId?: string): Promise<LiveShiftReport> => {
  if (!employeeId) {
    // No employee ID provided, return empty response
    return { type: 'NO_SHIFT', shiftStartTime: null };
  }

  try {
    // Use the /reports/shifts endpoint to check for active shifts
    // Query for shifts in a wide date range to find any currently open shift
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
    const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
    
    const params = new URLSearchParams({
      employeeId,
      startDate,
      endDate,
    });
    
    const response = await apiClient.get(`/reports/shifts?${params.toString()}`);
    const shifts = response.data;
    
    // Find an active (OPEN) shift
    const activeShift = shifts.find((shift: any) => shift.status === 'OPEN' || !shift.endTime);
    
    if (activeShift) {
      return {
        type: 'CURRENT_SHIFT',
        shiftStartTime: activeShift.startTime,
        shift: activeShift,
      };
    }
    
    return { type: 'NO_SHIFT', shiftStartTime: null };
  } catch (error: any) {
    // Silently handle errors - return null shift status instead of throwing
    // This prevents console spam when employees don't have shifts
    const is404 = error.response?.status === 404;
    if (!is404) {
      console.warn('Could not fetch shift status:', error.message);
    }
    return { type: 'NO_SHIFT', shiftStartTime: null };
  }
};

export const fetchPayInPayOutLog = async (
  startDate: string,
  endDate: string,
  options: { employeeId?: string; page?: number; limit?: number } = {},
): Promise<PayInPayOutLogResponse> => {
  const { employeeId, page, limit } = options;
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (employeeId) params.append('employeeId', employeeId);
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  const response = await apiClient.get(`/reports/pay-in-pay-out?${params.toString()}`);
  return response.data;
};

export const fetchEmployeeShifts = async (
  startDate: string,
  endDate: string,
  employeeId?: string,
): Promise<ShiftSummary[]> => {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (employeeId) {
      params.append('employeeId', employeeId);
    }

    const response = await apiClient.get(`/reports/shifts?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch employee shifts:', error);
    return [];
  }
};

export const fetchOrderDetails = async (
  orderId: string,
): Promise<OrderDetails> => {
  const response = await apiClient.get(`/reports/orders/${orderId}`);
  return response.data;
};

export const fetchUserName = async (userId: string): Promise<string> => {
  const response = await apiClient.get(`/api/users/name/${userId}`);
  return response.data.name;
};
