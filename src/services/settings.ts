import { apiClient } from './apiClient';

export interface AppSettings {
  id: string;
  restaurantName: string;
  restaurantDescription?: string;
  restaurantAddress?: string;
  openingTime: string;
  closingTime: string;
  farewellMessage: string;
  logo: string | null;
  currency: string;
  taxRate: number;
  createdAt: string;
  updatedAt: string;
  // Receipt settings
  receiptHeader?: string;
  receiptFooter?: string;
  showRestaurantName?: boolean;
  showDescription?: boolean;
  showAddress?: boolean;
  showTaxId?: boolean;
  showFarewellMessage?: boolean;
  taxIdNumber?: string;
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
