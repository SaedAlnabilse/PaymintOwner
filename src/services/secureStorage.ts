/**
 * Secure Storage Service
 * Uses react-native-keychain for encrypted storage of sensitive data like tokens
 * Falls back to AsyncStorage for non-sensitive data
 */
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Service name for keychain storage
const SERVICE_NAME = 'com.paymint.owner';

// Keys for different types of data
export const SECURE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_SESSION: 'user_session',
} as const;

export const STORAGE_KEYS = {
  USER_DATA: '@user',
  TENANT_INFO: '@tenant',
  SETTINGS: '@settings',
} as const;

class SecureStorageService {
  /**
   * Store sensitive data securely using Keychain
   * @param key - The key to store the data under
   * @param value - The value to store
   */
  async setSecureItem(key: string, value: string): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(key, value, {
        service: `${SERVICE_NAME}.${key}`,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return true;
    } catch (error) {
      console.error(`Failed to store secure item [${key}]:`, error);
      // Fallback to AsyncStorage (less secure, but better than failing)
      try {
        await AsyncStorage.setItem(`@secure_${key}`, value);
        return true;
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Retrieve sensitive data from Keychain
   * @param key - The key to retrieve
   */
  async getSecureItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: `${SERVICE_NAME}.${key}`,
      });
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get secure item [${key}]:`, error);
      // Try fallback from AsyncStorage
      try {
        return await AsyncStorage.getItem(`@secure_${key}`);
      } catch (fallbackError) {
        return null;
      }
    }
  }

  /**
   * Remove sensitive data from Keychain
   * @param key - The key to remove
   */
  async removeSecureItem(key: string): Promise<boolean> {
    try {
      await Keychain.resetGenericPassword({
        service: `${SERVICE_NAME}.${key}`,
      });
      // Also clear fallback if it exists
      await AsyncStorage.removeItem(`@secure_${key}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove secure item [${key}]:`, error);
      return false;
    }
  }

  /**
   * Store the access token securely
   */
  async storeToken(token: string): Promise<boolean> {
    return this.setSecureItem(SECURE_KEYS.ACCESS_TOKEN, token);
  }

  /**
   * Get the stored access token
   */
  async getToken(): Promise<string | null> {
    return this.getSecureItem(SECURE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Clear the stored access token
   */
  async clearToken(): Promise<boolean> {
    return this.removeSecureItem(SECURE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Clear all secure storage (for logout)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      this.removeSecureItem(SECURE_KEYS.ACCESS_TOKEN),
      this.removeSecureItem(SECURE_KEYS.REFRESH_TOKEN),
      this.removeSecureItem(SECURE_KEYS.USER_SESSION),
    ]);
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return biometryType !== null;
    } catch (error) {
      return false;
    }
  }
}

export const secureStorage = new SecureStorageService();
