import { apiClient } from './apiClient';

export interface AppSettings {
  id: string;
  restaurantName: string;
  openingTime: string;
  closingTime: string;
  farewellMessage: string;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    const response = await apiClient.get('/app-settings');
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch app settings:', error);
    throw error;
  }
};
