import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, LoginCredentials } from '../../services/authService';

const APP_BACKGROUND_TIME_KEY = '@app_background_time';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; name: string; role: string; email: string } | null;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
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
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
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
      
      if (!token || !user) {
        console.log('🔐 No stored session found');
        return rejectWithValue('No stored session found');
      }

      console.log('🔐 Found stored session, verifying token validity...');
      // Verify token is still valid by making a test API call
      try {
        const profileResponse = await authService.getProfile();
        console.log('🔐 Token is valid, user authenticated');
        return {
          token,
          user: profileResponse
        };
      } catch (apiError: any) {
        console.log('🔐 Token is invalid, clearing stored data');
        // Token is invalid, clear stored data
        await authService.logout();
        return rejectWithValue('Session expired');
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const userRole = action.payload.user?.role?.toUpperCase();
        const isAdminOrOwner = userRole === 'ADMIN' || userRole === 'OWNER';
        
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        // Only authenticate if user is admin or owner
        state.isAuthenticated = isAdminOrOwner;
        state.isLoading = false;
        state.error = isAdminOrOwner ? null : 'This app is for administrators only';
        
        // Clear any stored background time since user just logged in
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
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      // Logout thunk handler
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;