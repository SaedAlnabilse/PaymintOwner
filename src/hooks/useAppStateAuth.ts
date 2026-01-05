import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState, AppDispatch } from '../store/store';

// 4 minutes in milliseconds - timeout when app is completely closed/killed (disabled for now)
// const _APP_KILL_TIMEOUT = 4 * 60 * 1000;
const APP_BACKGROUND_TIME_KEY = '@app_background_time';
// Flag to track if this is a cold start (app just launched)
const IS_COLD_START_KEY = '@is_cold_start';

/**
 * Hook to handle authentication based on app state changes.
 * 
 * IMPORTANT: This hook ONLY logs out users when:
 * 1. The app was completely killed (not just backgrounded)
 * 2. AND more than 4 minutes passed since it was killed
 * 
 * When the app is in background (tablet screen off, home screen, etc.),
 * the user will STAY LOGGED IN forever - no matter how long.
 * 
 * How it works:
 * - When app goes to background: Store timestamp AND set cold start flag
 * - When app comes back from background: Clear both (app was NOT killed)
 * - On app startup: If cold start flag exists AND timestamp > 4min, logout
 *   The cold start flag being present means the app was killed while in background
 */
export const useAppStateAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const hasCheckedInitialRef = useRef(false);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    // On first render, check if this is a cold start (app was killed)
    const checkColdStartLogout = async () => {
      // Only run once per app lifecycle
      if (hasCheckedInitialRef.current) return;
      hasCheckedInitialRef.current = true;

      try {
        // Check if we have BOTH background time AND cold start flag
        // If cold start flag exists, it means the app was killed (not just resumed)
        const [backgroundTimeStr, coldStartFlag] = await Promise.all([
          AsyncStorage.getItem(APP_BACKGROUND_TIME_KEY),
          AsyncStorage.getItem(IS_COLD_START_KEY),
        ]);

        // Clear the cold start flag immediately - we only check it once on startup
        await AsyncStorage.removeItem(IS_COLD_START_KEY);

        // If there's no cold start flag, the app was just resumed from background
        // (the flag gets cleared when app comes back from background)
        if (!coldStartFlag) {
          console.log('📱 No cold start flag - app resumed normally, keeping user logged in');
          await AsyncStorage.removeItem(APP_BACKGROUND_TIME_KEY);
          return;
        }

        // Cold start flag exists - app was killed while in background
        if (backgroundTimeStr) {
          const backgroundTime = parseInt(backgroundTimeStr, 10);
          const currentTime = Date.now();
          const timeInBackground = currentTime - backgroundTime;

          console.log(`📱 COLD START: App was killed ${Math.round(timeInBackground / 1000)}s ago`);

          // DISABLED AUTO LOGOUT - User stays logged in forever
          // if (timeInBackground > APP_KILL_TIMEOUT) {
          //   console.log('📱 App was killed for more than 4 minutes, logging out user');
          //   dispatch(logoutUser());
          // } else {
             console.log('📱 Auto-logout disabled. Keeping user logged in.');
          // }

          // Clear the background time
          await AsyncStorage.removeItem(APP_BACKGROUND_TIME_KEY);
        } else {
          console.log('📱 Cold start but no background time found');
        }
      } catch (error) {
        console.error('📱 Error checking cold start:', error);
      }
    };

    // Handle app state changes
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      // Skip if this is the first render (app just started)
      if (isFirstRenderRef.current) {
        isFirstRenderRef.current = false;
        return;
      }

      console.log(`📱 App state changed: ${previousAppState} → ${nextAppState}`);

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background - store timestamp AND set cold start flag
        // If the app is killed, the flag will remain for the next startup
        // If the app resumes, we clear the flag below
        const backgroundTime = Date.now();
        await Promise.all([
          AsyncStorage.setItem(APP_BACKGROUND_TIME_KEY, backgroundTime.toString()),
          AsyncStorage.setItem(IS_COLD_START_KEY, 'true'),
        ]);
        console.log('📱 App backgrounded, storing timestamp and cold start flag');

      } else if (nextAppState === 'active') {
        // App is becoming active - clear BOTH background time AND cold start flag
        // This ensures that on next startup, we know the app wasn't killed
        console.log('📱 App came back from background, clearing cold start flag (not killed)');
        await Promise.all([
          AsyncStorage.removeItem(APP_BACKGROUND_TIME_KEY),
          AsyncStorage.removeItem(IS_COLD_START_KEY),
        ]);
      }
    };

    // Run cold start check on mount
    checkColdStartLogout();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [dispatch, isAuthenticated]);
};
