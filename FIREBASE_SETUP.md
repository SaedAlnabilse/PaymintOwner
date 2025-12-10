# Firebase Cloud Messaging Setup

To enable background notifications when the app is closed, you need to set up Firebase Cloud Messaging (FCM).

## 🔥 Firebase Console Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name (e.g., "PaymintOwner")
4. Follow the setup wizard

### 2. Add Android App

1. In Firebase Console, click the Android icon
2. Enter your Android package name (found in `android/app/build.gradle` under `applicationId`)
3. Download the `google-services.json` file
4. Place it in `android/app/google-services.json`

### 3. Add iOS App (Optional)

1. In Firebase Console, click the iOS icon
2. Enter your iOS bundle ID (found in Xcode)
3. Download the `GoogleService-Info.plist` file
4. Place it in `ios/YourAppName/GoogleService-Info.plist`

## 🤖 Android Configuration

### 1. Add google-services.json

Place the downloaded `google-services.json` file in:
```
android/app/google-services.json
```

### 2. Update android/build.gradle

Add the Google services classpath:

```gradle
buildscript {
    dependencies {
        // Add this line
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### 3. Update android/app/build.gradle

Add at the bottom of the file:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 4. Update AndroidManifest.xml

The permissions are already added, but make sure you have:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

## 🍎 iOS Configuration

### 1. Add GoogleService-Info.plist

Place the downloaded file in:
```
ios/YourAppName/GoogleService-Info.plist
```

### 2. Enable Push Notifications Capability

1. Open `ios/YourAppName.xcworkspace` in Xcode
2. Select your project in the navigator
3. Select your target
4. Go to "Signing & Capabilities"
5. Click "+ Capability"
6. Add "Push Notifications"
7. Add "Background Modes" and check "Remote notifications"

### 3. Upload APNs Certificate

1. In Firebase Console, go to Project Settings > Cloud Messaging
2. Under iOS app configuration, upload your APNs authentication key or certificate

## 🧪 Testing Background Notifications

### Test with Firebase Console

1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your FCM token (check app logs for the token)
6. Send the notification

### Test with Your Backend

Send a POST request to FCM:

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_FCM_TOKEN",
    "notification": {
      "title": "Cash SURPLUS Alert",
      "body": "Cash surplus of 862.020 JOD detected"
    },
    "data": {
      "type": "cash-alert",
      "notificationId": "123",
      "amount": "862.020"
    }
  }'
```

Replace:
- `YOUR_SERVER_KEY`: Found in Firebase Console > Project Settings > Cloud Messaging > Server key
- `DEVICE_FCM_TOKEN`: The token printed in your app logs

## 📱 Notification Types

### Cash Alert
```json
{
  "notification": {
    "title": "Cash SURPLUS Alert",
    "body": "Cash surplus of 862.020 JOD detected"
  },
  "data": {
    "type": "cash-alert",
    "notificationId": "123"
  }
}
```

### Stock Alert
```json
{
  "notification": {
    "title": "Low Stock Alert",
    "body": "Item XYZ is running low"
  },
  "data": {
    "type": "stock-alert",
    "priority": "high"
  }
}
```

### General Notification
```json
{
  "notification": {
    "title": "Order Complete",
    "body": "Order #123 has been completed"
  },
  "data": {
    "type": "general"
  }
}
```

## 🔧 Backend Integration

### Save FCM Token

When the app starts, it gets an FCM token. Send this to your backend:

```typescript
// In your app
const token = await messaging().getToken();
// Send token to your backend API
await fetch('https://your-api.com/save-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, userId: 'user123' })
});
```

### Send Notifications from Backend

Use the Firebase Admin SDK in your backend:

```javascript
// Node.js example
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification
await admin.messaging().send({
  token: userFcmToken,
  notification: {
    title: 'Cash SURPLUS Alert',
    body: 'Cash surplus of 862.020 JOD detected'
  },
  data: {
    type: 'cash-alert',
    notificationId: '123'
  },
  android: {
    priority: 'high'
  },
  apns: {
    payload: {
      aps: {
        contentAvailable: true
      }
    }
  }
});
```

## 🐛 Troubleshooting

### No background notifications?

1. **Check Firebase setup**: Verify `google-services.json` is in the correct location
2. **Rebuild the app**: `cd android && ./gradlew clean && cd .. && npm run android`
3. **Check FCM token**: Look for the token in app logs
4. **Test with Firebase Console**: Use the "Send test message" feature
5. **Check device settings**: Ensure notifications are enabled for your app

### Token not generated?

1. Verify Firebase is properly configured
2. Check internet connection
3. Ensure Google Play Services is installed (Android)
4. Check app logs for errors

### Notifications work in foreground but not background?

1. Verify background handler is registered in `index.js`
2. Check that the handler is registered BEFORE `AppRegistry.registerComponent`
3. Ensure notification channels are created

## 📝 Important Notes

- **FCM Token**: Changes when app is reinstalled or data is cleared
- **Background Handler**: Must be registered at the top level, not inside a component
- **Data-only messages**: Use `data` field for background processing
- **Notification + Data**: Use both for rich notifications
- **iOS**: Requires physical device for testing (simulator doesn't support push notifications)
- **Android**: Works on emulator if Google Play Services is installed

## 🔐 Security

- Never commit `google-services.json` or `GoogleService-Info.plist` to public repositories
- Keep your Firebase server key secure
- Use Firebase Admin SDK on your backend, not in the app
- Validate notification data on your backend before sending

## 📚 Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Docs](https://rnfirebase.io/)
- [Notifee Docs](https://notifee.app/)
- [FCM HTTP v1 API](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
