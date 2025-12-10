import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutUser } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store/store';

// 4 minutes in milliseconds - timeout when app is completely closed/killed
const APP_KILL_TIMEOUT = 4 * 60 * 1000;
const APP_BACKGROUND_TIME_KEY = '@app_background_time';

/**
 * Hook to handle authentication based on app state changes.
 * 
 * Behavior:
 * - When app goes to background: Store timestamp but keep user logged in
 * - When app becomes active: Check if it was closed for more than 4 minutes
 * - If closed > 4 minutes: Log out user
 * - If just backgrounded: Keep user logged in
 */
export const useAppStateAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      console.log(`📱 App state changed: ${previousAppState} → ${nextAppState}`);

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background - store the timestamp
        const backgroundTime = Date.now();
        await AsyncStorage.setItem(APP_BACKGROUND_TIME_KEY, backgroundTime.toString());
        console.log('📱 App backgrounded, storing timestamp:', new Date(backgroundTime).toISOString());
        
      } else if (nextAppState === 'active' && (previousAppState === 'background' || previousAppState === 'inactive')) {
        // App is becoming active - check if it was closed for too long
        try {
          const backgroundTimeStr = await AsyncStorage.getItem(APP_BACKGROUND_TIME_KEY);
          
          if (backgroundTimeStr) {
            const backgroundTime = parseInt(backgroundTimeStr, 10);
            const currentTime = Date.now();
            const timeInBackground = currentTime - backgroundTime;
            
            console.log(`📱 App active after ${Math.round(timeInBackground / 1000)}s in background`);
            
            if (timeInBackground > APP_KILL_TIMEOUT) {
              console.log('📱 App was closed for more than 4 minutes, logging out user');
              dispatch(logoutUser());
            } else {
              console.log('📱 App was just backgrounded, keeping user logged in');
            }
            
            // Clear the background time since we've processed it
            await AsyncStorage.removeItem(APP_BACKGROUND_TIME_KEY);
          } else {
            console.log('📱 No background time found, app likely just started');
          }
        } catch (error) {
          console.error('📱 Error checking background time:', error);
        }
      }
    };

    // Check if we have a stored background time on hook initialization
    const checkInitialBackgroundTime = async () => {
      try {
        const backgroundTimeStr = await AsyncStorage.getItem(APP_BACKGROUND_TIME_KEY);
        
        if (backgroundTimeStr) {
          const backgroundTime = parseInt(backgroundTimeStr, 10);
          const currentTime = Date.now();
          const timeInBackground = currentTime - backgroundTime;
          
          console.log(`📱 Found stored background time, app was closed for ${Math.round(timeInBackground / 1000)}s`);
          
          if (timeInBackground > APP_KILL_TIMEOUT) {
            console.log('📱 App was closed for more than 4 minutes on startup, logging out user');
            dispatch(logoutUser());
          }
          
          // Clear the background time
          await AsyncStorage.removeItem(APP_BACKGROUND_TIME_KEY);
        }
      } catch (error) {
        console.error('📱 Error checking initial background time:', error);
      }
    };

    checkInitialBackgroundTime();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [dispatch, isAuthenticated]);
};