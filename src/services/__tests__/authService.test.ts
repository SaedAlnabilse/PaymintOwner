
import { authService } from '../authService';
import { apiClient } from '../apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the dependencies
jest.mock('../apiClient');
jest.mock('@react-native-async-storage/async-storage');

// Use jest.Mocked to get typed mocks
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AuthService', () => {
  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should log in, store token/user, and return login data on success', async () => {
      // Arrange
      const credentials = { username: 'testuser', password: 'password123', tenantSlug: 'test-tenant' };
      const mockLoginResponse = {
        access_token: 'fake-jwt-token',
        user: { id: '1', name: 'Test User', username: 'testuser', role: 'owner', employeeId: 'E1', email: 'test@test.com' },
      };
      
      // Mock the API response
      mockedApiClient.post.mockResolvedValueOnce({ data: mockLoginResponse });

      // Act
      const result = await authService.login(credentials);

      // Assert
      // 1. Check if apiClient.post was called correctly
      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        username: credentials.username,
        password: credentials.password,
        tenantSlug: credentials.tenantSlug,
      });
      expect(mockedApiClient.post).toHaveBeenCalledTimes(1);

      // 2. Check if token and user were stored in AsyncStorage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@owner_access_token', mockLoginResponse.access_token);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@owner_user', JSON.stringify(mockLoginResponse.user));
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);

      // 3. Check if the result matches the mock response
      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw an error if login API call fails', async () => {
      // Arrange
      const credentials = { username: 'wronguser', password: 'wrongpassword', tenantSlug: 'test-tenant' };
      const errorMessage = 'Invalid credentials';
      
      // Mock the API to reject the request
      mockedApiClient.post.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      // 1. Expect the login promise to be rejected
      await expect(authService.login(credentials)).rejects.toThrow(errorMessage);

      // 2. Ensure nothing was stored in AsyncStorage
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
