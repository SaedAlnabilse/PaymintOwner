import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/apiClient';
import { logout } from './authSlice';

export interface Notification {
  id: string;
  type: 'STOCK_ALERT_YELLOW' | 'STOCK_ALERT_RED' | 'OUT_OF_STOCK' | 'SYSTEM' | 'PASSWORD_RESET' | 'CASH_ALERT' | 'REFUND' | 'INFO';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  itemId?: string;
  userId?: string;
  item?: {
    id: string;
    name: string;
    availableStock: number;
  };
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requestedBy?: {
    id: string;
    username: string;
    name?: string;
  };
  metadata?: Record<string, any>;
}

interface NotificationsState {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  notificationsEnabled: boolean;
  systemUpdate: { version: string; url: string; notes: string } | null;
}

const initialState: NotificationsState = {
  notifications: [],
  total: 0,
  unreadCount: 0,
  isLoading: false,
  error: null,
  notificationsEnabled: true,
  systemUpdate: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async ({
    isRead,
    limit = 50,
    offset = 0,
  }: { isRead?: boolean; limit?: number; offset?: number } = {}, { getState }) => {
    const params = new URLSearchParams();
    if (isRead !== undefined) params.append('isRead', String(isRead));
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    // Fetch regular notifications
    const response = await apiClient.get(
      `/api/notifications?${params.toString()}`,
    );

    const regularNotifications = response.data.notifications || [];

    // Try to fetch admin notifications if user is an admin
    let adminNotifications: any[] = [];
    try {
      const state: any = getState();
      const userId = state.auth?.user?.id;
      const userRole = state.auth?.user?.role;

      if (userId && (userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'owner' || userRole === 'ADMIN')) {
        const adminResponse = await apiClient.get(`/api/notifications/admin/${userId}`);
        adminNotifications = (adminResponse.data || []).map((notif: any) => ({
          ...notif,
          isRead: notif.read,
        }));
      }
    } catch (_error) {
      console.log('ℹ️ No admin notifications or not an admin user');
    }

    // Combine all types of notifications
    const allNotifications = [...adminNotifications, ...regularNotifications];

    return {
      notifications: allNotifications,
      total: allNotifications.length,
      unreadCount: allNotifications.filter((n: any) => !n.isRead).length,
    };
  },
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    const response = await apiClient.get('/api/notifications/unread-count');
    return response.data.count;
  },
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string) => {
    const response = await apiClient.patch(`/api/notifications/${id}/read`);
    return response.data;
  },
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    const response = await apiClient.patch('/api/notifications/read-all');
    return response.data;
  },
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id: string) => {
    await apiClient.delete(`/api/notifications/${id}`);
    return id;
  },
);

// Delete all notifications tied to a specific item
export const deleteNotificationsByItemId = createAsyncThunk(
  'notifications/deleteByItemId',
  async (itemId: string) => {
    try {
      await apiClient.delete(`/api/notifications/by-item/${itemId}`);
    } catch (_error) {
      console.warn(
        'deleteNotificationsByItemId: backend endpoint failed or missing',
      );
    }
    return itemId;
  },
);

// Auto-cleanup outdated stock notifications
export const cleanupOutdatedStockNotifications = createAsyncThunk(
  'notifications/cleanupOutdated',
  async (
    items: {
      id: string;
      availableStock: number;
      lowStockThresholdYellow?: number;
      lowStockThresholdRed?: number;
    }[],
  ) => {
    const response = await apiClient.post(
      '/api/notifications/cleanup-outdated',
      { items },
    );
    return response.data;
  },
);

// Check for system updates
export const checkForUpdates = createAsyncThunk(
  'notifications/checkForUpdates',
  async () => {
    try {
      const response = await apiClient.get('/updates/version.json');
      return response.data;
    } catch (_e) {
      return null;
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.notificationsEnabled = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
    cleanupLocalNotifications: (
      state,
      action: PayloadAction<
        {
          id: string;
          availableStock: number;
          lowStockThresholdYellow?: number;
          lowStockThresholdRed?: number;
        }[]
      >,
    ) => {
      // Local cleanup logic
      const items = action.payload;
      const toDelete = new Set<string>();
      const stockAlertTypes = new Set(['STOCK_ALERT_YELLOW', 'STOCK_ALERT_RED', 'OUT_OF_STOCK']);
      const itemsMap = new Map(items.map(item => [item.id, item]));

      state.notifications.forEach(notification => {
        if (notification.itemId && stockAlertTypes.has(notification.type)) {
          const item = itemsMap.get(notification.itemId);
          if (item) {
            const yellowThreshold = item.lowStockThresholdYellow || 0;
            const redThreshold = item.lowStockThresholdRed || 0;
            if (item.availableStock > Math.max(yellowThreshold, redThreshold)) {
              toDelete.add(notification.id);
            }
          }
        }
      });

      if (toDelete.size > 0) {
        state.notifications = state.notifications.filter(n => !toDelete.has(n.id));
        // Recalculate unread count loosely
        state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkForUpdates.fulfilled, (state, action) => {
        if (action.payload) {
          const { version, url, notes } = action.payload;
          const currentVersion = '1.0.0';
          if (version > currentVersion) {
            state.systemUpdate = { version, url, notes };
          }
        }
      })
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.total = action.payload.total;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload.id);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(cleanupOutdatedStockNotifications.fulfilled, (state, action) => {
        const deletedIds = action.payload.deletedNotificationIds || [];
        state.notifications = state.notifications.filter(n => !deletedIds.includes(n.id));
        state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      })
      .addCase(logout, (state) => {
        state.notifications = [];
        state.total = 0;
        state.unreadCount = 0;
        state.systemUpdate = null;
      });
  },
});

export const { setNotificationsEnabled, clearError, cleanupLocalNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;