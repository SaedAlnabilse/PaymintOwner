import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushNotificationService } from './pushNotificationService';

const TOKEN_KEY = '@owner_access_token';
const USER_KEY = '@owner_user';
const TENANT_KEY = '@owner_tenant';

export interface LoginCredentials {
  username: string;
  password: string;
  tenantSlug: string;
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
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
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
    return !!token;
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
}

export const authService = new AuthService();
