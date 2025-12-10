# Cash Alerts Push Notifications

## ✅ What's Been Implemented

I've successfully integrated push notifications for cash alerts in your app. Here's what was added:

### 1. **Push Notification Service** (`src/services/pushNotificationService.ts`)
   - Handles all push notification functionality
   - Supports both Android and iOS
   - Creates dedicated notification channels:
     - **Cash Alerts** (high priority, orange color)
     - **Stock Alerts** (configurable priority)
     - **General Notifications** (default priority)

### 2. **Automatic Cash Alert Notifications**
   - The `NotificationsScreen` now automatically detects new cash alerts
   - When a new cash alert appears, a push notification is sent immediately
   - Notifications include:
     - 💰 Icon
     - Alert title (e.g., "Cash SURPLUS Alert")
     - Full message with details
     - Orange color accent (Android)

### 3. **Badge Count Management**
   - App icon badge automatically updates with unread notification count
   - Badge clears when notifications are read

### 4. **App Initialization**
   - Push notifications are configured on app startup
   - Permissions are requested automatically

## 🚀 How to Use

### Installation

1. Install the dependencies:
```bash
npm install
```

2. For iOS, install pods:
```bash
cd ios && pod install && cd ..
```

3. Follow the platform-specific setup in `PUSH_NOTIFICATIONS_SETUP.md`

### Running the App

```bash
# Android
npm run android

# iOS
npm run ios
```

## 📱 How It Works

### Automatic Detection
The app polls for new notifications every 5 seconds. When a new cash alert is detected:

1. The notification is added to the list
2. A push notification is automatically triggered
3. The user sees a system notification with:
   - Title: "💰 Cash SURPLUS Alert" (or DEFICIT)
   - Message: Full details about the cash discrepancy
   - Sound and vibration
   - Orange accent color

### User Experience

**When app is open:**
- User sees the notification in the Cash Alerts screen
- Push notification appears in the notification tray
- Badge count updates

**When app is in background:**
- Push notification appears in the notification tray
- User can tap to open the app
- Badge count shows on app icon

**When app is closed:**
- Push notification still appears (local notifications work offline)
- Tapping opens the app to the Cash Alerts screen

## 🎨 Notification Appearance

### Android
- Large dollar sign icon
- Orange accent color (#F97316)
- High priority (appears at top of notification shade)
- Vibration pattern
- Sound alert

### iOS
- Dollar sign emoji in title
- Badge on app icon
- Sound alert
- Banner notification

## 🔧 Customization

You can customize notifications in `src/services/pushNotificationService.ts`:

```typescript
// Change notification sound
soundName: 'custom_sound.mp3'

// Change vibration pattern
vibration: 500 // milliseconds

// Change priority
importance: 'max' // 'min' | 'low' | 'default' | 'high' | 'max'

// Change color (Android)
color: '#FF0000' // Any hex color
```

## 📋 Testing

1. Run the app on a device (notifications don't work well in simulators)
2. Grant notification permissions when prompted
3. Navigate to the Cash Alerts screen
4. Wait for a new cash alert to be created (or trigger one from your backend)
5. You should see a push notification appear

## 🐛 Troubleshooting

### No notifications appearing?

**Android:**
- Check Settings > Apps > Your App > Notifications are enabled
- Verify the app has notification permission
- Check battery optimization isn't blocking notifications

**iOS:**
- Check Settings > Your App > Notifications are enabled
- Verify you granted permissions when prompted
- Try reinstalling the app

### Notifications not making sound?

- Check device is not in silent/Do Not Disturb mode
- Verify notification channel settings (Android)
- Check app notification settings

### Badge count not updating?

- iOS: Requires proper entitlements
- Android: Depends on launcher support (works on most modern launchers)

## 📝 Next Steps (Optional Enhancements)

1. **Remote Push Notifications**: Set up Firebase Cloud Messaging (FCM) to send notifications from your backend server

2. **Notification Actions**: Add action buttons like "View Details" or "Dismiss"

3. **Notification Grouping**: Group multiple cash alerts together

4. **Custom Sounds**: Add custom notification sounds for different alert types

5. **Notification History**: Store notification history for later viewing

6. **User Preferences**: Let users customize notification settings (sound, vibration, etc.)

## 🔐 Permissions

The app requests these permissions:

**Android:**
- `POST_NOTIFICATIONS` (Android 13+)
- `VIBRATE`
- `RECEIVE_BOOT_COMPLETED`

**iOS:**
- Notification permissions (alert, badge, sound)

Users can revoke these permissions at any time in device settings.

## 📚 Additional Resources

- [React Native Push Notification Docs](https://github.com/zo0r/react-native-push-notification)
- [iOS Push Notification Docs](https://github.com/react-native-push-notification/ios)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)
- [iOS Notification Best Practices](https://developer.apple.com/design/human-interface-guidelines/notifications)
