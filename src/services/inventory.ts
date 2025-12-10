import { apiClient } from './apiClient';
import { Notification, NotificationsResponse, OrderDetails } from '../types/reports';

export const fetchNotifications = async (
  options: { isRead?: boolean; limit?: number; offset?: number } = {}
): Promise<NotificationsResponse> => {
  const { isRead, limit = 50, offset = 0 } = options;
  const params = new URLSearchParams();
  if (isRead !== undefined) {
    params.append('isRead', String(isRead));
  }
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  const response = await apiClient.get(`/api/notifications?${params.toString()}`);
  return {
    notifications: response.data.notifications || [],
    total: response.data.total || 0,
    unreadCount: response.data.unreadCount || 0,
  };
};

export const fetchUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get('/api/notifications/unread-count');
  return response.data.count;
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  const response = await apiClient.patch(`/api/notifications/${id}/read`);
  return response.data;
};

export const deleteNotification = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/notifications/${id}`);
};

export const getStockAlertCount = async (): Promise<number> => {
  try {
    const response = await fetchNotifications({ limit: 100 });
    const stockAlerts = response.notifications.filter(
      n =>
        n.type === 'STOCK_ALERT_YELLOW' ||
        n.type === 'STOCK_ALERT_RED' ||
        n.type === 'OUT_OF_STOCK'
    );
    return stockAlerts.filter(n => !n.isRead).length;
  } catch (error) {
    console.error('Failed to get stock alert count:', error);
    return 0;
  }
};

export const fetchOrderById = async (orderId: string): Promise<OrderDetails> => {
  const response = await apiClient.get(`/api/orders/${orderId}`);
  return response.data;
};

export const fetchOrderByOrderNumber = async (orderNumber: number): Promise<OrderDetails> => {
  const response = await apiClient.get(`/api/orders/by-number/${orderNumber}`);
  return response.data;
};