import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL_KEY = '@paymint_api_url';
const STORE_ID_KEY = '@paymint_store_id';

export const AppSettingsService = {
  /**
   * Get the stored API URL. Returns null if not set.
   */
  getApiUrl: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(API_URL_KEY);
    } catch (error) {
      console.error('Error reading API URL:', error);
      return null;
    }
  },

  /**
   * Save the API URL and Store ID (optional)
   */
  setSettings: async (apiUrl: string, storeId?: string): Promise<void> => {
    try {
      // Ensure URL doesn't have trailing slash
      const cleanUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      
      await AsyncStorage.setItem(API_URL_KEY, cleanUrl);
      if (storeId) {
        await AsyncStorage.setItem(STORE_ID_KEY, storeId);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  /**
   * Get the stored Store ID.
   */
  getStoreId: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORE_ID_KEY);
    } catch (error) {
      return null;
    }
  },

  /**
   * Clear all settings (Reset App)
   */
  clearSettings: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([API_URL_KEY, STORE_ID_KEY]);
    } catch (error) {
      console.error('Error clearing settings:', error);
    }
  }
};
