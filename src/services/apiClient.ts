import axios from 'axios';
import store from '../store/store';
import { API_URL } from '../config/api.config';
import { logout } from '../store/slices/authSlice';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

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
          `${API_URL}/api/users/${userId}/clock-out`,
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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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