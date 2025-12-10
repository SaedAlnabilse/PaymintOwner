import { apiClient } from './apiClient';

export interface User {
  id: string;
  name: string; // or fullName based on backend
  username: string;
  email?: string;
  role: 'ADMIN' | 'USER' | 'EMPLOYEE' | 'MANAGER'; // Adjust based on actual enums
  pinCode?: string;
  isClockedIn?: boolean; // Derived or from specific endpoint
}

export interface CreateUserDto {
  name: string;
  username: string;
  email?: string;
  password?: string;
  pinCode: string;
  role: string;
}

export interface UpdateUserDto {
  name?: string;
  username?: string;
  email?: string;
  pinCode?: string;
  role?: string;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get('/api/users');
  return response.data;
};

export const createUser = async (userData: CreateUserDto): Promise<User> => {
  const response = await apiClient.post('/api/users', userData);
  return response.data;
};

export const updateUser = async (userId: string, userData: UpdateUserDto): Promise<User> => {
  const response = await apiClient.put(`/api/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/api/users/${userId}`);
};

// Clock out user / mark as offline
export const clockOutUser = async (userId: string): Promise<void> => {
  await apiClient.post(`/api/users/${userId}/clock-out`);
};

// Clock in user / mark as online
export const clockInUser = async (userId: string): Promise<void> => {
  await apiClient.post(`/api/users/${userId}/clock-in`);
};
