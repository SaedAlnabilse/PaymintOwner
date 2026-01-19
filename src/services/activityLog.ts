import { apiClient } from './apiClient';

export interface ActivityLog {
  id: string;
  performedBy: {
    name: string;
  };
  action: string;
  description: string;
  module: string;
  timestamp: string;
  userId: string;
  ipAddress: string;
}

interface GetLogsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  module?: string;
}

export const fetchActivityLogs = async (params: GetLogsParams = {}): Promise<ActivityLog[]> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.userId) queryParams.append('userId', params.userId);
  if (params.action) queryParams.append('action', params.action);
  if (params.module) queryParams.append('module', params.module);

  const response = await apiClient.get(`/activity-log?${queryParams.toString()}`);

  // Handle different response structures (array or object with logs property)
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (response.data && response.data.logs) {
    return response.data.logs;
  }
  return [];
};

export const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'CLOCK_IN', label: 'Clock In' },
  { value: 'CLOCK_OUT', label: 'Clock Out' },
  { value: 'REFUND', label: 'Refund' },
  { value: 'ORDER', label: 'Order' },
];
