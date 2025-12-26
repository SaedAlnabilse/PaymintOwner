import { Platform } from 'react-native';

/**
 * API Configuration
 * 
 * Environment modes:
 * - PRODUCTION: Uses the deployed backend on Railway
 * - LOCAL: Uses local development server
 */

// Toggle between production and local development
const USE_PRODUCTION = false; // Set to true to use production Railway server

// Production API URL (deployed on Railway)
const PRODUCTION_API_URL = 'https://grateful-liberation-production-d036.up.railway.app';

// Local development configuration
const YOUR_COMPUTER_IP = '192.168.1.36'; // Your computer's IP for physical devices
const LOCAL_PORT = '3000';

/**
 * Determines the correct API URL based on the environment
 */
export const getApiUrl = (): string => {
  if (USE_PRODUCTION) {
    return PRODUCTION_API_URL;
  }

  if (Platform.OS === 'android') {
    // Android Emulator uses 10.0.2.2
    return `http://10.0.2.2:${LOCAL_PORT}`;
  }

  // iOS Simulator or other platforms
  return `http://localhost:${LOCAL_PORT}`;
};

export const API_URL = getApiUrl();