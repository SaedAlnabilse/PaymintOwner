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
    const response = await apiClient.get('/api/app-settings');
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch app settings:', error);
    throw error;
  }
};

export interface UpdateAppSettingsDto {
  restaurantName?: string;
  farewellMessage?: string;
  openingTime?: string;
  closingTime?: string;
}

export const updateAppSettings = async (data: UpdateAppSettingsDto): Promise<AppSettings> => {
  try {
    const response = await apiClient.patch('/api/app-settings', data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to update app settings:', error);
    throw error;
  }
};
