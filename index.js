/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Create notification channels on app start (required for background notifications)
async function createNotificationChannels() {
  await notifee.createChannel({
    id: 'cash-alerts',
    name: 'Cash Alerts',
    description: 'Notifications for cash surplus and deficit alerts',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  await notifee.createChannel({
    id: 'stock-alerts',
    name: 'Stock Alerts',
    description: 'Notifications for low stock and out of stock items',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  await notifee.createChannel({
    id: 'general',
    name: 'General Notifications',
    description: 'General app notifications',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
    vibration: true,
  });
}

// Create channels immediately
createNotificationChannels();

// Notifee background event handler - REQUIRED for background notifications
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  console.log('📨 Notifee background event:', type, detail);

  // Handle notification press
  if (type === EventType.PRESS) {
    console.log('User pressed notification:', notification);
    // Handle navigation or other actions here
  }

  // Handle action button press
  if (type === EventType.ACTION_PRESS) {
    console.log('User pressed action:', pressAction?.id);
  }

  // Handle notification dismiss
  if (type === EventType.DISMISSED) {
    console.log('User dismissed notification:', notification?.id);
  }
});

// Background message handler - MUST be registered outside of application lifecycle
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📨 Background message received:', remoteMessage);

  const { notification, data } = remoteMessage;
  const type = data?.type || 'general';

  // Convert data values to strings
  const stringifiedData = data ? Object.keys(data).reduce((acc, key) => {
    acc[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
    return acc;
  }, {}) : undefined;

  try {
    if (type === 'cash-alert') {
      // For background/locked screen notifications, show hidden message for privacy
      // The full details are only visible when the user opens the app
      const isHidden = data?.isHidden === 'true';
      const displayTitle = isHidden ? '💰 Cash Alert' : `💰 ${notification?.title || 'Cash Alert'}`;
      const displayBody = isHidden
        ? 'You have a new cash alert. Open the app to view details.'
        : (notification?.body || '');

      await notifee.displayNotification({
        title: displayTitle,
        body: displayBody,
        data: stringifiedData,
        android: {
          channelId: 'cash-alerts',
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          color: '#F97316',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          style: { type: AndroidStyle.BIGTEXT, text: displayBody },
          sound: 'default',
          vibrationPattern: [300, 500],
          // Show on lock screen but with hidden content
          visibility: isHidden ? 0 : 1, // 0 = PRIVATE (hidden on lock screen), 1 = PUBLIC
        },
        ios: {
          sound: 'default',
          categoryId: 'CASH_ALERT',
        },
      });
    } else if (type === 'stock-alert') {
      await notifee.displayNotification({
        title: `📦 ${notification?.title || 'Stock Alert'}`,
        body: notification?.body || '',
        data: stringifiedData,
        android: {
          channelId: 'stock-alerts',
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          color: '#F97316',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          style: { type: AndroidStyle.BIGTEXT, text: notification?.body || '' },
          sound: 'default',
          vibrationPattern: [300, 500],
        },
        ios: {
          sound: 'default',
          categoryId: 'STOCK_ALERT',
        },
      });
    } else {
      await notifee.displayNotification({
        title: notification?.title || 'Notification',
        body: notification?.body || '',
        data: stringifiedData,
        android: {
          channelId: 'general',
          importance: AndroidImportance.DEFAULT,
          pressAction: { id: 'default' },
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          style: { type: AndroidStyle.BIGTEXT, text: notification?.body || '' },
          sound: 'default',
          vibrationPattern: [300, 500],
        },
        ios: {
          sound: 'default',
        },
      });
    }
    console.log('✅ Background notification displayed');
  } catch (error) {
    console.error('❌ Failed to display background notification:', error);
  }
});

// Suppress specific warnings
LogBox.ignoreLogs([
  'Require cycle:',
  'Remote debugger',
  'This method is deprecated (as well as all React Native Firebase namespaced API)', // Ignore firebase deprecation warning
]);

// Wrap App component with error handling
const AppWithErrorHandling = () => {
  try {
    return <App />;
  } catch (error) {
    console.error('App initialization error:', error);
    return null;
  }
};

AppRegistry.registerComponent(appName, () => AppWithErrorHandling);
