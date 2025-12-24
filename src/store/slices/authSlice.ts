import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, LoginCredentials } from '../../services/authService';
import { RootState } from '../store';

const APP_BACKGROUND_TIME_KEY = '@app_background_time';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; name: string; role: string; email: string } | null;
  error: string | null;
  selectedTenant: Tenant | null;
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  selectedTenant: null,
};

// Helper function to clear background time
const clearBackgroundTime = async () => {
  try {
    await AsyncStorage.removeItem(APP_BACKGROUND_TIME_KEY);
  } catch (error) {
    console.error('Failed to clear background time:', error);
  }
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: Omit<LoginCredentials, 'tenantSlug'>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const tenantSlug = state.auth.selectedTenant?.slug;

      if (!tenantSlug) {
        return rejectWithValue('No restaurant connected. Please connect first.');
      }

      const response = await authService.login({
        ...credentials,
        tenantSlug
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
      // We continue to clear state even if API fails
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔐 Checking authentication status...');
      const token = await authService.getToken();
      const user = await authService.getUser();
      const tenant = await authService.getTenant();

      if (!token || !user) {
        console.log('🔐 No stored session found');
        return { token: null, user: null, tenant };
      }

      console.log('🔐 Found stored session, verifying token validity...');
      // Try to verify token is still valid
      try {
        const profileResponse = await authService.getProfile();
        console.log('🔐 Token is valid, user authenticated');
        return {
          token,
          user: profileResponse,
          tenant
        };
      } catch (apiError: any) {
        const status = apiError.response?.status;
        if (status === 401) {
          console.log('🔐 Token is invalid (401), clearing stored user data');
          await authService.clearToken();
          await authService.clearUser();
          return { token: null, user: null, tenant };
        }

        return {
          token,
          user,
          tenant
        };
      }
    } catch (error: any) {
      console.log('🔐 Authentication check failed:', error.message);
      return rejectWithValue('Authentication check failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
    selectTenant(state, action: PayloadAction<Tenant>) {
      state.selectedTenant = action.payload;
      authService.storeTenant(action.payload);
    },
    clearTenant(state) {
      state.selectedTenant = null;
      authService.clearTenant();
      // Also logout if tenant cleared
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      authService.clearToken();
      authService.clearUser();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const userRole = action.payload.user?.role?.toUpperCase();
        const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'MANAGER';

        state.token = action.payload.access_token;
        state.user = action.payload.user;
        state.isAuthenticated = isAdminOrOwner;
        state.isLoading = false;
        state.error = isAdminOrOwner ? null : 'This app is for administrators only';

        if (isAdminOrOwner) {
          clearBackgroundTime();
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.selectedTenant = action.payload.tenant;
        state.isAuthenticated = !!action.payload.token;
        state.isLoading = false;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { logout, clearError, selectTenant, clearTenant } = authSlice.actions;
export default authSlice.reducer;