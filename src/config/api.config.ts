import { Platform } from 'react-native';

/**
 * API Configuration
 * 
 * Supports dynamic configuration via Setup Screen.
 */

export const DEFAULT_PRODUCTION_URL = 'https://grateful-liberation-production-d036.up.railway.app';

// Mutable API URL - Defaults to Production for safety, but will be overwritten by AppSettingsService
export let API_URL = DEFAULT_PRODUCTION_URL;

/**
 * Updates the global API URL.
 * Call this during app initialization.
 */
export const setApiUrl = (url: string) => {
  // Remove trailing slash if present
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  API_URL = cleanUrl;
  console.log('🔄 API URL updated to:', API_URL);
};

/**
 * Helper to generate full image URLs.
 * Handles relative paths from the backend and fixes common extension errors.
 */
export const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  
  // Fix common double extension issues from older uploads
  const cleanPath = path
    .replace('/public', '')
    .replace('.jjpg', '.jpg')
    .replace('.ppng', '.png')
    .replace('.jjpeg', '.jpeg')
    .replace('.gggif', '.gif')
    .replace('.wwebp', '.webp')
    .replace('.hheic', '.heic')
    .replace('.hheif', '.heif');

  const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  
  return `${API_URL}${finalPath}`;
};

// Export for debugging
export const API_CONFIG = {
  get url() { return API_URL; },
  platform: Platform.OS,
};
