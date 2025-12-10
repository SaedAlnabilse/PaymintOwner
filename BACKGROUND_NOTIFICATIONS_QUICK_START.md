# Background Notifications - Quick Start

## ✅ What's Been Done

I've set up Firebase Cloud Messaging (FCM) so notifications work when your app is closed or in the background.

## 🚀 Next Steps (Required)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Name it something like "PaymintOwner"

### 2. Add Android App to Firebase

1. In Firebase Console, click the Android icon (⚙️ > Project settings)
2. Click "Add app" and select Android
3. Enter package name: `com.paymintowner`
4. Download `google-services.json`
5. **Replace** the placeholder file at `android/app/google-services.json` with your downloaded file

### 3. Rebuild the App

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 4. Get Your FCM Token

1. Run the app
2. Check the logs for: `📱 FCM Token: ...`
3. Copy this token - you'll need it for testing

### 5. Test Background Notifications

#### Option A: Firebase Console (Easiest)
1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter title and message
4. Click "Send test message"
5. Paste your FCM token
6. Close your app completely
7. Click "Test" - you should see a notification!

#### Option B: Your Backend
Send notifications from your server using the Firebase Admin SDK (see FIREBASE_SETUP.md)

## 📱 How It Works Now

- **App Open**: Notifications show immediately
- **App Background**: Notifications appear in notification tray
- **App Closed**: Notifications still work! 🎉

## 🔧 Backend Integration

Your backend needs to:
1. Store user FCM tokens (sent automatically when app starts)
2. Send notifications via Firebase Admin SDK when cash alerts occur

Example notification payload:
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

## 📚 Full Documentation

See `FIREBASE_SETUP.md` for complete setup instructions and backend integration.
