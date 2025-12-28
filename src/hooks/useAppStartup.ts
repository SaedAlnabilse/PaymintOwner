import { useCallback, useEffect } from 'react';
import { AppSettingsService } from '../services/AppSettingsService';
import { setApiUrl } from '../config/api.config';
import { updateApiClientUrl } from '../services/apiClient';

export const useAppStartup = () => {
  const fetchAndSetInitialSettings = useCallback(async () => {
    try {
      // 1. Load Dynamic API URL First
      const savedApiUrl = await AppSettingsService.getApiUrl();
      if (savedApiUrl) {
        console.log('🚀 Loading saved API URL:', savedApiUrl);
        setApiUrl(savedApiUrl);
        updateApiClientUrl(savedApiUrl);
      } else {
        console.log('ℹ️ No saved API URL, using default.');
      }
    } catch (error) {
      console.error('Failed to load app settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchAndSetInitialSettings();
  }, [fetchAndSetInitialSettings]);

  return { fetchAndSetInitialSettings };
};
