# Push Notifications Setup Guide

This guide will help you set up push notifications for cash alerts in your React Native app.

## 📦 Installation

Run the following command to install the required dependencies:

```bash
npm install
```

Or if you prefer yarn:

```bash
yarn install
```

## 🤖 Android Setup

### 1. Update AndroidManifest.xml

Add the following permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Add these permissions -->
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

    <application>
        <!-- Add this meta-data for notification icon -->
        <meta-data
            android:name="com.dieam.reactnativepushnotification.notification_foreground"
            android:value="true"/>
        <meta-data
            android:name="com.dieam.reactnativepushnotification.notification_color"
            android:resource="@color/white"/>

        <!-- Add this receiver -->
        <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationActions"
            android:exported="true"/>
        <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationPublisher"
            android:exported="true"/>
        <receiver android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationBootEventReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="com.htc.intent.action.QUICKBOOT_POWERON"/>
            </intent-filter>
        </receiver>

        <service
            android:name="com.dieam.reactnativepushnotification.modules.RNPushNotificationListenerService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

### 2. Add Notification Icons (Optional but Recommended)

Create notification icons in `android/app/src/main/res/`:
- `drawable-mdpi/ic_notification.png` (24x24)
- `drawable-hdpi/ic_notification.png` (36x36)
- `drawable-xhdpi/ic_notification.png` (48x48)
- `drawable-xxhdpi/ic_notification.png` (72x72)
- `drawable-xxxhdpi/ic_notification.png` (96x96)

### 3. Update colors.xml

Add to `android/app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="white">#FFFFFF</color>
</resources>
```

## 🍎 iOS Setup

### 1. Update Info.plist

Add to `ios/YourAppName/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

### 2. Update AppDelegate

Update `ios/YourAppName/AppDelegate.mm`:

```objc
#import <UserNotifications/UserNotifications.h>
#import <RNCPushNotificationIOS.h>

// Add this at the top of the file

// Add these methods before @end

// Required for the register event.
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
 [RNCPushNotificationIOS didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Required for the notification event. You must call the completion handler after handling the remote notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [RNCPushNotificationIOS didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

// Required for the registrationError event.
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
 [RNCPushNotificationIOS didFailToRegisterForRemoteNotificationsWithError:error];
}

// Required for localNotification event
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
  [RNCPushNotificationIOS didReceiveNotificationResponse:response];
  completionHandler();
}

// Required for the localNotification event.
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionBadge);
}
```

### 3. Install Pods

```bash
cd ios
pod install
cd ..
```

## 🚀 Usage

The push notification service is already integrated into your app. Here's how it works:

### Automatic Cash Alerts

When a new cash alert is detected in the NotificationsScreen, a push notification will automatically be sent to the user's device.

### Manual Notifications

You can also manually trigger notifications from anywhere in your app:

```typescript
import { pushNotificationService } from './src/services/pushNotificationService';

// Show a cash alert
pushNotificationService.showCashAlert(
  'Cash SURPLUS Alert',
  'Cash surplus of 862.020 JOD detected',
  { notificationId: '123', type: 'CASH_ALERT' }
);

// Show a stock alert
pushNotificationService.showStockAlert(
  'Low Stock Alert',
  'Item XYZ is running low on stock',
  'high', // priority: 'low' | 'medium' | 'high'
  { itemId: '456' }
);

// Show a general notification
pushNotificationService.showGeneralNotification(
  'Order Complete',
  'Order #123 has been completed'
);

// Update badge count
pushNotificationService.setBadgeCount(5);

// Clear badge
pushNotificationService.clearBadge();
```

## 🔧 Notification Channels

The app creates three notification channels on Android:

1. **Cash Alerts** - High priority, for cash surplus/deficit notifications
2. **Stock Alerts** - High priority, for low stock and out of stock items
3. **General** - Default priority, for other notifications

## 🧪 Testing

### Android
1. Build and run the app: `npm run android`
2. The app will request notification permissions on Android 13+
3. Navigate to the Cash Alerts screen
4. When a new cash alert appears, you should receive a push notification

### iOS
1. Build and run the app: `npm run ios`
2. The app will request notification permissions on first launch
3. Grant the permissions
4. Navigate to the Cash Alerts screen
5. When a new cash alert appears, you should receive a push notification

## 🐛 Troubleshooting

### Notifications not showing on Android

1. Check that permissions are granted in Settings > Apps > Your App > Notifications
2. Verify that the notification channel is enabled
3. Check logcat for errors: `adb logcat | grep Push`

### Notifications not showing on iOS

1. Check that notification permissions are granted in Settings > Your App > Notifications
2. Verify that the app is properly signed
3. Check Xcode console for errors

### Badge count not updating

- On iOS, make sure you have the proper entitlements
- On Android, badge count support depends on the launcher

## 📝 Notes

- Local notifications work offline and don't require a backend server
- For remote push notifications (from your backend), you'll need to set up Firebase Cloud Messaging (FCM) for Android and Apple Push Notification service (APNs) for iOS
- The current implementation uses local notifications which are triggered by the app itself when it detects new cash alerts

## 🔐 Permissions

The app will automatically request notification permissions:
- **Android 13+**: Runtime permission request
- **Android <13**: Granted by default
- **iOS**: Permission request on first launch

Users can manage notification preferences in their device settings.
