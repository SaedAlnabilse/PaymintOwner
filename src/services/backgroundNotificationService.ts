import { AppState, AppStateStatus } from 'react-native';
import { apiClient } from './apiClient';
import { pushNotificationService } from './pushNotificationService';

class BackgroundNotificationService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastCashAlertIds: Set<string> = new Set();
  private isInitialized = false;
  private appState: AppStateStatus = 'active';
  private appStateSubscription: any = null;

  async initialize() {
    if (this.isInitialized) return;

    console.log('🔄 [Background] Initializing background notification service');

    // Listen to app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Get initial cash alerts to set baseline
    await this.loadInitialCashAlerts();

    // Start background polling (fast interval for responsiveness)
    this.startBackgroundPolling(5000);

    this.isInitialized = true;
    console.log('✅ [Background] Background notification service initialized');
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log(`📱 [Background] App state changed: ${this.appState} → ${nextAppState}`);
    this.appState = nextAppState;

    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background - keep polling fast to ensure notifications are received
      // Note: On some devices, the OS may throttle this after a while.
      this.startBackgroundPolling(5000); 
    } else if (nextAppState === 'active') {
      // App became active - polling every 3 seconds
      this.startBackgroundPolling(3000); 
    }
  };

  private async loadInitialCashAlerts() {
    try {
      const response = await apiClient.get('/api/notifications/cash-alerts?limit=50');
      const cashAlerts = response.data.notifications || [];
      this.lastCashAlertIds = new Set(cashAlerts.map((alert: any) => alert.id as string));
      console.log(`📊 [Background] Loaded ${cashAlerts.length} existing cash alerts as baseline`);
    } catch (error) {
      console.error('❌ [Background] Failed to load initial cash alerts:', error);
    }
  }

  private startBackgroundPolling(interval: number = 5000) {
    // Clear existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Start new interval
    this.intervalId = setInterval(() => {
      this.checkForNewCashAlerts();
    }, interval);

    console.log(`⏰ [Background] Started polling every ${interval / 1000} seconds`);
  }

  private async checkForNewCashAlerts() {
    try {
      const response = await apiClient.get('/api/notifications/cash-alerts?limit=10');
      const cashAlerts = response.data.notifications || [];
      const currentIds = new Set(cashAlerts.map((alert: any) => alert.id as string));

      // Find new alerts
      const newAlerts = cashAlerts.filter((alert: any) => !this.lastCashAlertIds.has(alert.id));

      if (newAlerts.length > 0) {
        console.log(`🔔 [Background] Found ${newAlerts.length} new cash alerts`);
        
        // Show notifications for new alerts
        for (const alert of newAlerts) {
          console.log(`📢 [Background] Showing notification for: ${alert.title}`);
          await pushNotificationService.showCashAlert(
            alert.title,
            alert.message,
            { 
              notificationId: alert.id, 
              type: 'CASH_ALERT',
              isBackground: true,
            }
          );
        }

        // Update the baseline
        this.lastCashAlertIds = new Set(cashAlerts.map((alert: any) => alert.id as string));
      }
    } catch (error: any) {
      // Silently handle errors to avoid spam
      if (error?.response?.status !== 401) {
        console.warn('⚠️ [Background] Failed to check for cash alerts:', error?.message);
      }
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.isInitialized = false;
    console.log('🛑 [Background] Background notification service stopped');
  }
}

export const backgroundNotificationService = new BackgroundNotificationService();