# PayMint Owner - Mobile Reports App

A simplified mobile app for cafe owners to monitor their business reports remotely.

## Features

- **Secure Login**: Only admin/manager accounts can access
- **Real-time Reports**: View net sales, card/cash sales, orders, refunds
- **Date Range Filters**: Today, Last 7 Days, Last 30 Days, This Month
- **Top Selling Items**: See your best performing products
- **Recent Orders**: Monitor all transactions with refund status
- **Pull to Refresh**: Get latest data instantly
- **Sidebar Navigation**: Ready for additional screens

## Quick Start

```bash
# Navigate to project
cd PaymintOwner

# Start Metro bundler
npx react-native start

# In another terminal, run on Android
npx react-native run-android
```

## Build Release APK

```bash
cd android
./gradlew assembleRelease
# APK at: android/app/build/outputs/apk/release/app-release.apk
```

## API Configuration

Production API: https://grateful-liberation-production-d036.up.railway.app

To use local dev server, edit `src/config/api.config.ts`:
- Set `USE_PRODUCTION = false`
- Update `YOUR_COMPUTER_IP`

## Adding New Screens

Add to `src/navigation/AppNavigator.tsx` in the Drawer.Navigator.

## Colors

- Primary: #7CC39F
- Success: #D1FAE5
- Error: #D55263
