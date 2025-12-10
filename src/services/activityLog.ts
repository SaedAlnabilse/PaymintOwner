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
}

export const fetchActivityLogs = async (params: GetLogsParams = {}): Promise<ActivityLog[]> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const response = await apiClient.get(`/activity-log?${queryParams.toString()}`);
  
  // Handle different response structures (array or object with logs property)
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (response.data && response.data.logs) {
    return response.data.logs;
  }
  return [];
};
