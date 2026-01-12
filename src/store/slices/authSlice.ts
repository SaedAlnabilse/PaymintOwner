import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, LoginCredentials, AccountLoginCredentials } from '../../services/authService';
import { RootState } from '../store';

const APP_BACKGROUND_TIME_KEY = '@app_background_time';

// Legacy tenant interface (for backward compatibility)
interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

// Account interface (new)
interface Account {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
}

// Establishment interface (new)
interface Establishment {
  id: string;
  name: string;
  establishmentLoginId: string;
  type: string;
  currency: string;
  subscriptionStatus: string;
  trialEndDate?: string;
}

interface AuthState {
  // Legacy fields (kept for backward compatibility)
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; name: string; role: string; email: string } | null;
  error: string | null;
  selectedTenant: Tenant | null;

  // New Account-based auth fields
  account: Account | null;
  establishments: Establishment[];
  currentEstablishment: Establishment | null;
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  selectedTenant: null,
  // New fields
  account: null,
  establishments: [],
  currentEstablishment: null,
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

      // Also check for new account-based auth
      const account = await authService.getAccount();
      const establishments = await authService.getEstablishments();
      const currentEstablishment = await authService.getCurrentEstablishment();

      // If we have account-based auth, use that
      if (token && account) {
        console.log('🔐 Found stored account session');
        return {
          token,
          user: null,
          tenant: null,
          account,
          establishments: establishments || [],
          currentEstablishment,
        };
      }

      // Legacy user-based auth
      if (!token || !user) {
        console.log('🔐 No stored session found');
        return { token: null, user: null, tenant, account: null, establishments: [], currentEstablishment: null };
      }

      console.log('🔐 Found stored session, trusting token...');

      // OPTIMISTIC AUTH: Trust the stored token immediately.
      // We removed the background getProfile() call to prevent race conditions
      // where headers aren't set yet, which was causing accidental logouts.

      return {
        token,
        user,
        tenant,
        account: null,
        establishments: [],
        currentEstablishment: null,
      };
    } catch (error: any) {
      console.log('🔐 Authentication check failed:', error.message);
      return rejectWithValue('Authentication check failed');
    }
  }
);

// ========== NEW ACCOUNT-BASED AUTH THUNKS ==========

export const loginAccount = createAsyncThunk(
  'auth/loginAccount',
  async (credentials: AccountLoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.loginAccount(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
    }
  }
);

export const logoutAccount = createAsyncThunk(
  'auth/logoutAccount',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logoutAccount();
    } catch (error: any) {
      console.error('Logout error:', error);
      // We continue to clear state even if API fails
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
    // New account-based reducers
    selectEstablishment(state, action: PayloadAction<Establishment>) {
      state.currentEstablishment = action.payload;
      // Also set it as the legacy selectedTenant for compatibility
      state.selectedTenant = {
        id: action.payload.id,
        name: action.payload.name,
        slug: action.payload.establishmentLoginId,
      };
      authService.storeCurrentEstablishment(action.payload);
      authService.storeTenant({
        id: action.payload.id,
        name: action.payload.name,
        slug: action.payload.establishmentLoginId,
      });
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
        // New account-based fields
        state.account = action.payload.account;
        state.establishments = action.payload.establishments || [];
        state.currentEstablishment = action.payload.currentEstablishment;
        // Authentication is based on having a token (either legacy or account-based)
        state.isAuthenticated = !!action.payload.token && (!!action.payload.user || !!action.payload.account);
        state.isLoading = false;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.account = null;
        state.establishments = [];
        state.currentEstablishment = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      // Account-based auth handlers
      .addCase(loginAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAccount.fulfilled, (state, action) => {
        state.token = action.payload.access_token;
        state.account = action.payload.account;
        state.establishments = action.payload.establishments || [];
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;

        // If there's only one establishment, auto-select it
        if (action.payload.establishments?.length === 1) {
          const est = action.payload.establishments[0];
          state.currentEstablishment = est;
          state.selectedTenant = {
            id: est.id,
            name: est.name,
            slug: est.establishmentLoginId,
          };
          authService.storeCurrentEstablishment(est);
          authService.storeTenant({
            id: est.id,
            name: est.name,
            slug: est.establishmentLoginId,
          });
        }

        clearBackgroundTime();
      })
      .addCase(loginAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutAccount.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.account = null;
        state.establishments = [];
        state.currentEstablishment = null;
        state.selectedTenant = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      });
  },
});

export const { logout, clearError, selectTenant, clearTenant, selectEstablishment } = authSlice.actions;
export default authSlice.reducer;