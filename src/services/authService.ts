import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushNotificationService } from './pushNotificationService';
import { secureStorage } from './secureStorage';

const USER_KEY = '@owner_user';
const TENANT_KEY = '@owner_tenant';
const ACCOUNT_KEY = '@owner_account';
const ESTABLISHMENTS_KEY = '@owner_establishments';
const CURRENT_ESTABLISHMENT_KEY = '@owner_current_establishment';

// Legacy employee login credentials
export interface LoginCredentials {
  username: string;
  password: string;
  tenantSlug: string;
}

// Account-based login credentials (for Owner app)
export interface AccountLoginCredentials {
  email: string;
  password: string;
}

// Account login response
export interface AccountLoginResponse {
  access_token: string;
  account: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
  establishments: Array<{
    id: string;
    name: string;
    establishmentLoginId: string;
    type: string;
    currency: string;
    subscriptionStatus: string;
    trialEndDate?: string;
  }>;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
    employeeId: string;
    email: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: string;
  employeeId: string;
  email: string;
  isActive: boolean;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post('/api/auth/login', {
        username: credentials.username,
        password: credentials.password,
        tenantSlug: credentials.tenantSlug,
      });

      const data: LoginResponse = response.data;

      if (data.access_token) {
        await this.storeToken(data.access_token);

        // If user data is missing in login response, fetch it
        if (!data.user) {
          try {
            // Manually pass token since Redux store isn't updated yet
            const profileResponse = await apiClient.get('/api/auth/profile', {
              headers: {
                Authorization: `Bearer ${data.access_token}`,
              },
            });
            data.user = profileResponse.data as any;
          } catch (profileError) {
            console.warn('Failed to fetch user profile after login:', profileError);
          }
        }

        if (data.user) {
          await this.storeUser(data.user);
        }

        // Send FCM token to backend after successful login
        await pushNotificationService.sendPendingToken();
      }

      return data;
    } catch (error: any) {
      console.error('Login failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get('/api/auth/profile');
      return response.data;
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.error('Failed to get profile:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error: any) {
      // Ignore 401 errors on logout as it means token is already invalid/expired
      if (error.response?.status !== 401) {
        console.warn('Logout request failed:', error.response?.data || error.message);
      }
    } finally {
      await this.clearToken();
      await this.clearUser();
    }
  }

  async storeToken(token: string): Promise<void> {
    try {
      if (!token) return;
      await secureStorage.storeToken(token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await secureStorage.getToken();
      return token;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await secureStorage.clearToken();
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  async storeUser(user: any): Promise<void> {
    try {
      if (!user) {
        console.warn('Attempted to store null/undefined user');
        return;
      }
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user:', error);
    }
  }

  async getUser(): Promise<any | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    // Check if token is expired by decoding the JWT payload
    try {
      const payload = this.decodeJwtPayload(token);
      if (!payload || !payload.exp) {
        // Token doesn't have expiration, assume valid
        return true;
      }

      // Check if token is expired (exp is in seconds)
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp < currentTime) {
        // Token is expired, clear it and return false
        console.warn('Token expired, clearing authentication');
        await this.clearToken();
        await this.clearUser();
        await this.clearAccount();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  /**
   * Decode JWT payload without verification (for expiration check only)
   * Returns null if token is invalid
   */
  private decodeJwtPayload(token: string): { exp?: number; iat?: number; [key: string]: any } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Base64 decode the payload (second part)
      const payload = parts[1];
      // Handle base64url encoding (replace - with + and _ with /)
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = atob(base64);
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  async storeTenant(tenant: any): Promise<void> {
    try {
      if (!tenant) return;
      await AsyncStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
    } catch (error) {
      console.error('Failed to store tenant:', error);
    }
  }

  async getTenant(): Promise<any | null> {
    try {
      const tenantJson = await AsyncStorage.getItem(TENANT_KEY);
      return tenantJson ? JSON.parse(tenantJson) : null;
    } catch (error) {
      console.error('Failed to get tenant:', error);
      return null;
    }
  }

  async clearTenant(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TENANT_KEY);
    } catch (error) {
      console.error('Failed to clear tenant:', error);
    }
  }

  // ========== ACCOUNT-BASED AUTHENTICATION (New Flow) ==========

  async loginAccount(credentials: AccountLoginCredentials): Promise<AccountLoginResponse> {
    try {
      const response = await apiClient.post('/api/accounts/login', {
        email: credentials.email,
        password: credentials.password,
      });

      const data: AccountLoginResponse = response.data;

      if (data.access_token) {
        await this.storeToken(data.access_token);

        if (data.account) {
          await this.storeAccount(data.account);
        }

        if (data.establishments && data.establishments.length > 0) {
          await this.storeEstablishments(data.establishments);
        }

        // Send FCM token to backend after successful login
        await pushNotificationService.sendPendingToken();
      }

      return data;
    } catch (error: any) {
      console.error('Account login failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async logoutAccount(): Promise<void> {
    try {
      await apiClient.post('/api/accounts/logout');
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.warn('Account logout request failed:', error.response?.data || error.message);
      }
    } finally {
      await this.clearToken();
      await this.clearAccount();
      await this.clearEstablishments();
      await this.clearCurrentEstablishment();
    }
  }

  async storeAccount(account: any): Promise<void> {
    try {
      if (!account) return;
      await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    } catch (error) {
      console.error('Failed to store account:', error);
    }
  }

  async getAccount(): Promise<any | null> {
    try {
      const accountJson = await AsyncStorage.getItem(ACCOUNT_KEY);
      return accountJson ? JSON.parse(accountJson) : null;
    } catch (error) {
      console.error('Failed to get account:', error);
      return null;
    }
  }

  async clearAccount(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACCOUNT_KEY);
    } catch (error) {
      console.error('Failed to clear account:', error);
    }
  }

  async storeEstablishments(establishments: any[]): Promise<void> {
    try {
      if (!establishments) return;
      await AsyncStorage.setItem(ESTABLISHMENTS_KEY, JSON.stringify(establishments));
    } catch (error) {
      console.error('Failed to store establishments:', error);
    }
  }

  async getEstablishments(): Promise<any[] | null> {
    try {
      const json = await AsyncStorage.getItem(ESTABLISHMENTS_KEY);
      return json ? JSON.parse(json) : null;
    } catch (error) {
      console.error('Failed to get establishments:', error);
      return null;
    }
  }

  async clearEstablishments(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ESTABLISHMENTS_KEY);
    } catch (error) {
      console.error('Failed to clear establishments:', error);
    }
  }

  async storeCurrentEstablishment(establishment: any): Promise<void> {
    try {
      if (!establishment) return;
      await AsyncStorage.setItem(CURRENT_ESTABLISHMENT_KEY, JSON.stringify(establishment));
    } catch (error) {
      console.error('Failed to store current establishment:', error);
    }
  }

  async getCurrentEstablishment(): Promise<any | null> {
    try {
      const json = await AsyncStorage.getItem(CURRENT_ESTABLISHMENT_KEY);
      return json ? JSON.parse(json) : null;
    } catch (error) {
      console.error('Failed to get current establishment:', error);
      return null;
    }
  }

  async clearCurrentEstablishment(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CURRENT_ESTABLISHMENT_KEY);
    } catch (error) {
      console.error('Failed to clear current establishment:', error);
    }
  }
}

export const authService = new AuthService();
