import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { apiClient } from './apiClient';

// Dynamically import Notifee to handle cases where it's not yet linked
let notifee: any = null;
let AndroidImportance: any = null;
let AndroidStyle: any = null;

try {
  const NotifeeModule = require('@notifee/react-native');
  notifee = NotifeeModule.default;
  AndroidImportance = NotifeeModule.AndroidImportance;
  AndroidStyle = NotifeeModule.AndroidStyle;
} catch (error) {
  console.warn('Notifee not available yet. Please rebuild the app.');
}

class PushNotificationService {
  private isConfigured = false;
  private channelsCreated = false;
  private pendingFcmToken: string | null = null; // Store token until user logs in

  async configure() {
    if (this.isConfigured) return;
    
    if (!notifee) {
      console.warn('⚠️ Notifee not available. Please rebuild the app.');
      return;
    }
    
    try {
      // Create notification channels for Android
      if (Platform.OS === 'android' && !this.channelsCreated) {
        await notifee.createChannel({
          id: 'cash-alerts',
          name: 'Cash Alerts',
          description: 'Notifications for cash surplus and deficit alerts',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
        console.log('📢 Cash Alerts channel created');

        await notifee.createChannel({
          id: 'stock-alerts',
          name: 'Stock Alerts',
          description: 'Notifications for low stock and out of stock items',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
        console.log('📦 Stock Alerts channel created');

        await notifee.createChannel({
          id: 'general',
          name: 'General Notifications',
          description: 'General app notifications',
          importance: AndroidImportance.DEFAULT,
          sound: 'default',
          vibration: true,
        });
        console.log('🔔 General channel created');

        this.channelsCreated = true;
      }

      // Setup FCM for background notifications
      await this.setupFCM();

      this.isConfigured = true;
      console.log('✅ Notifee configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure Notifee:', error);
    }
  }

  async setupFCM() {
    // FCM setup disabled - using local notifications only
    console.log('ℹ️ FCM disabled - using local notifications for cash alerts');
  }

  // FCM token methods disabled - using local notifications only
  async sendTokenToBackend(token: string) {
    console.log('ℹ️ FCM token sending disabled - using local notifications');
  }

  async sendPendingToken() {
    console.log('ℹ️ FCM token sending disabled - using local notifications');
  }

  async handleRemoteMessage(remoteMessage: any) {
    if (!notifee) return;

    const { notification, data } = remoteMessage;
    
    // Determine notification type from data
    const type = data?.type || 'general';
    const isHidden = data?.isHidden === 'true';
    
    try {
      if (type === 'cash-alert') {
        // For foreground, we can show full details since user is in the app
        // But if isHidden flag is set, respect it for consistency
        const title = isHidden ? 'Cash Alert' : (notification?.title || 'Cash Alert');
        const body = isHidden 
          ? 'You have a new cash alert. Tap to view details.' 
          : (notification?.body || '');
        
        await this.showCashAlert(title, body, data);
      } else if (type === 'stock-alert') {
        await this.showStockAlert(
          notification?.title || 'Stock Alert',
          notification?.body || '',
          data?.priority || 'medium',
          data
        );
      } else {
        await this.showGeneralNotification(
          notification?.title || 'Notification',
          notification?.body || '',
          data
        );
      }
    } catch (error) {
      console.error('❌ Failed to handle remote message:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!notifee) {
      console.warn('⚠️ Notifee not available. Please rebuild the app.');
      return false;
    }
    
    try {
      const settings = await notifee.requestPermission();
      console.log('📱 Notification permission status:', settings.authorizationStatus);
      return settings.authorizationStatus >= 1; // 1 = authorized, 2 = provisional
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      return false;
    }
  }

  async showCashAlert(title: string, message: string, data?: any) {
    await this.configure();

    if (!notifee) {
      console.warn('⚠️ Notifee not available. Please rebuild the app.');
      return;
    }

    // Convert data values to strings (Notifee requirement)
    const stringifiedData = data ? Object.keys(data).reduce((acc, key) => {
      acc[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
      return acc;
    }, {} as Record<string, string>) : undefined;

    // Show hidden notification for privacy (always show generic message)
    const hiddenTitle = '💰 Cash Alert';
    const hiddenMessage = 'You have a new cash alert. Open the app to view details.';

    try {
      await notifee.displayNotification({
        title: hiddenTitle,
        body: hiddenMessage,
        data: stringifiedData,
        android: {
          channelId: 'cash-alerts',
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
          color: '#F97316', // Orange color
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          style: {
            type: AndroidStyle.BIGTEXT,
            text: hiddenMessage,
          },
          sound: 'default',
          vibrationPattern: [300, 500],
          // Always show as private notification for security
          visibility: 0, // PRIVATE - hides content on lock screen
          // Make it persistent and high priority
          ongoing: false,
          autoCancel: true,
        },
        ios: {
          sound: 'default',
          categoryId: 'CASH_ALERT',
          // iOS equivalent of private notification
          interruptionLevel: 'active',
        },
      });
      console.log('✅ Cash alert notification displayed (hidden for privacy)');
    } catch (error) {
      console.error('❌ Failed to display cash alert:', error);
    }
  }

  async showStockAlert(title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium', data?: any) {
    await this.configure();

    if (!notifee) {
      console.warn('⚠️ Notifee not available. Please rebuild the app.');
      return;
    }

    const colors = {
      low: '#F59E0B', // Yellow
      medium: '#F97316', // Orange
      high: '#DC2626', // Red
    };

    const importance = priority === 'high' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT;

    // Convert data values to strings (Notifee requirement)
    const stringifiedData = data ? Object.keys(data).reduce((acc, key) => {
      acc[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
      return acc;
    }, {} as Record<string, string>) : undefined;

    try {
      await notifee.displayNotification({
        title: `📦 ${title}`,
        body: message,
        data: stringifiedData,
        android: {
          channelId: 'stock-alerts',
          importance: importance,
          pressAction: {
            id: 'default',
          },
          color: colors[priority],
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          style: {
            type: AndroidStyle.BIGTEXT,
            text: message,
          },
          sound: 'default',
          vibrationPattern: priority === 'high' ? [500, 500] : [300, 500], // Even number of values required
        },
        ios: {
          sound: 'default',
          categoryId: 'STOCK_ALERT',
        },
      });
      console.log('✅ Stock alert notification displayed');
    } catch (error) {
      console.error('❌ Failed to display stock alert:', error);
    }
  }

  async showGeneralNotification(title: string, message: string, data?: any) {
    await this.configure();

    if (!notifee) {
      console.warn('⚠️ Notifee not available. Please rebuild the app.');
      return;
    }

    // Convert data values to strings (Notifee requirement)
    const stringifiedData = data ? Object.keys(data).reduce((acc, key) => {
      acc[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
      return acc;
    }, {} as Record<string, string>) : undefined;

    try {
      await notifee.displayNotification({
        title: title,
        body: message,
        data: stringifiedData,
        android: {
          channelId: 'general',
          importance: AndroidImportance.DEFAULT,
          pressAction: {
            id: 'default',
          },
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          style: {
            type: AndroidStyle.BIGTEXT,
            text: message,
          },
          sound: 'default',
          vibrationPattern: [300, 500], // Even number of values required
        },
        ios: {
          sound: 'default',
        },
      });
      console.log('✅ General notification displayed');
    } catch (error) {
      console.error('❌ Failed to display general notification:', error);
    }
  }

  async cancelAllNotifications() {
    if (!notifee) return;
    
    try {
      await notifee.cancelAllNotifications();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel notifications:', error);
    }
  }

  async cancelNotification(id: string) {
    if (!notifee) return;
    
    try {
      await notifee.cancelNotification(id);
      console.log('✅ Notification cancelled:', id);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  async setBadgeCount(count: number) {
    if (!notifee) return;
    
    try {
      await notifee.setBadgeCount(count);
      console.log('✅ Badge count set to:', count);
    } catch (error) {
      console.error('❌ Failed to set badge count:', error);
    }
  }

  async clearBadge() {
    await this.setBadgeCount(0);
  }
}

export const pushNotificationService = new PushNotificationService();
