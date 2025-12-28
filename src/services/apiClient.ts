import axios from 'axios';
import store from '../store/store';
import { API_URL as CONFIG_API_URL } from '../config/api.config';
import { logout } from '../store/slices/authSlice';

// Re-export API_URL as a live binding from the config
export { API_URL } from '../config/api.config';

export const apiClient = axios.create({
  baseURL: CONFIG_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Updates the Base URL for the API client.
 * Call this when the AppSettings change.
 */
export const updateApiClientUrl = (newUrl: string) => {
  console.log('🔄 Updating Axios Base URL to:', newUrl);
  apiClient.defaults.baseURL = newUrl;
};

// Flag to prevent multiple logout calls
let isLoggingOut = false;

// Function to handle forced logout (e.g., on 429 or 401 errors)
const handleForcedLogout = async () => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    const state = store.getState();
    const userId = state.auth.user?.id;

    // Mark user as offline in staff management if we have a user ID
    if (userId) {
      try {
        await axios.post(
          `${apiClient.defaults.baseURL}/api/users/${userId}/clock-out`,
          {},
          {
            headers: {
              Authorization: `Bearer ${state.auth.token}`,
            },
          }
        );
      } catch (clockOutError) {
        // Silently fail - user might already be clocked out or endpoint might not exist
        console.warn('Could not clock out user:', clockOutError);
      }
    }

    // Clear the store and logout
    store.dispatch(logout());
  } finally {
    isLoggingOut = false;
  }
};

// Add a request interceptor
apiClient.interceptors.request.use(
  config => {
    const state = store.getState();
    const token = state.auth.token;
    const tenantSlug = state.auth.selectedTenant?.slug;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (tenantSlug) {
      config.headers['x-tenant-slug'] = tenantSlug;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status;

    // Handle 429 (Too Many Requests) - just log warning, don't logout
    if (status === 429) {
      console.warn('Rate limit exceeded (429). Request will be retried by the caller.');
      // Don't logout on rate limit - the dashboard service handles retries
    }

    // Handle 401 (Unauthorized) - token expired or invalid
    if (status === 401) {
      console.warn('Unauthorized (401). Logging out user.');
      await handleForcedLogout();
    }

    return Promise.reject(error);
  }
);
