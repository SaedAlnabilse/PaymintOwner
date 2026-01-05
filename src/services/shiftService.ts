import { apiClient } from './apiClient';

export interface Shift {
  id: string;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'completed';
  cashFloat: number;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;
  notes?: string;
  userId: string;
}

export const shiftService = {
  /**
   * Get the current active shift for the whole store (any user)
   */
  getStoreActiveShift: async (): Promise<Shift | null> => {
    try {
      const response = await apiClient.get('/api/shifts/check-conflict');
      // If hasConflict is true, conflictShift is the one. If false, myShift might be the one.
      return response.data.conflictShift || response.data.myShift || null;
    } catch (error) {
      console.error('Failed to get store active shift:', error);
      return null;
    }
  },

  /**
   * Get the most recently closed shift for the whole store
   */
  getLatestClosedShift: async (): Promise<Shift | null> => {
    try {
      // Fetch latest closed shifts from reports endpoint
      const response = await apiClient.get('/reports/shifts', {
        params: {
          limit: 1,
          status: 'CLOSED'
        }
      });
      return response.data[0] || null;
    } catch (error) {
      console.error('Failed to get latest closed shift:', error);
      return null;
    }
  },

  /**
   * Get the current active shift for the logged-in user
   */
  getCurrentShift: async (): Promise<Shift | null> => {
    try {
      const response = await apiClient.get('/api/shifts/current');
      return response.data;
    } catch (error: any) {
      // If 404, it means no active shift, which is valid
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Failed to get current shift:', error);
      throw error;
    }
  },

  /**
   * Start a new shift
   */
  startShift: async (cashFloat: number): Promise<Shift> => {
    try {
      const response = await apiClient.post('/api/shifts/start', { cashFloat });
      return response.data;
    } catch (error: any) {
      console.error('Failed to start shift:', error);
      throw error;
    }
  },

  /**
   * End the current shift
   */
  endShift: async (shiftId: string, actualCash: number, notes?: string): Promise<Shift> => {
    try {
      const response = await apiClient.post(`/api/shifts/${shiftId}/end`, { 
        actualCash, 
        notes 
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to end shift:', error);
      throw error;
    }
  }
};
