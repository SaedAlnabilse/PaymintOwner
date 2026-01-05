import { AppSettings, Discount, PaymentMethod, CardType } from '../types/salesManagement';
import { apiClient } from './apiClient';
import { errorNotificationService } from './errorNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache for faster subsequent access
let cachedCardTypes: CardType[] | null = null;
let cachedPaymentMethods: PaymentMethod[] | null = null;

export async function getAppSettings(): Promise<AppSettings> {
  const result: AppSettings = {
    id: '',
    restaurantName: '',
    logo: null,
    currency: '',
    taxRate: 0,
    openingTime: '',
    closingTime: '',
    farewellMessage: '',
    createdAt: '',
    discounts: [],
    paymentMethods: [],
    cardTypes: [],
  };

  // Fetch all data in parallel for faster loading
  const [appSettingsData, discountsData, paymentMethodsData, cardTypesData] =
    await Promise.all([
      // App settings
      apiClient
        .get('/app-settings')
        .then(res => {
          return res.data;
        })
        .catch((error: any) => {
          if (error.response?.status !== 401 && error.response?.status !== 429) {
            console.error('Failed to fetch app settings', error);
          }
          return null;
        }),

      // Discounts
      apiClient
        .get('/app-settings/discounts')
        .then(res => {
          return res.data || [];
        })
        .catch((error: any) => {
          if (error.response?.status !== 401 && error.response?.status !== 429) {
            console.error('Failed to fetch discounts', error);
          }
          return [];
        }),

      // Payment methods
      apiClient
        .get('/app-settings/payment-methods')
        .then(res => {
          return res.data || [];
        })
        .catch((error: any) => {
          if (error.response?.status !== 401 && error.response?.status !== 429) {
             console.error('Failed to fetch payment methods', error);
          }
          return [];
        }),

      // Card Types - check cache first for faster loading
      (async () => {
        try {
          const cached = await AsyncStorage.getItem('@card_types');
          if (cached) {
            const parsed = JSON.parse(cached);
            // Return cached data immediately, but also refresh in background
            setTimeout(async () => {
              try {
                const fresh = await apiClient.get('/card-types');
                if (fresh.data) {
                  await AsyncStorage.setItem('@card_types', JSON.stringify(fresh.data));
                }
              } catch (error) {
                // Ignore background refresh errors
              }
            }, 100);
            return parsed;
          }
        } catch (cacheError) {
          console.warn('Failed to read card types from cache:', cacheError);
        }

        // No cache or cache failed, fetch from API
        try {
          const res = await apiClient.get('/card-types');
          const data = res.data || [];
          // Cache the result
          await AsyncStorage.setItem('@card_types', JSON.stringify(data));
          return data;
        } catch (error: any) {
          if (error.response?.status !== 401 && error.response?.status !== 429) {
            console.error('Failed to fetch card types', error);
          }
          return [];
        }
      })(),
    ]);

  // Assign results
  if (appSettingsData) {
    Object.assign(result, appSettingsData);
  }
  result.discounts = discountsData;
  result.paymentMethods = paymentMethodsData;
  result.cardTypes = cardTypesData;

  return result;
}

export async function updateTaxRate(taxRate: number): Promise<AppSettings> {
  const res = await apiClient.put('/app-settings/tax-rate', { taxRate });
  return res.data;
}

export async function updateCurrency(currency: string): Promise<AppSettings> {
  const res = await apiClient.put('/app-settings', { currency });
  return res.data;
}

// Discounts
export async function getDiscounts(): Promise<Discount[]> {
  const res = await apiClient.get('/app-settings/discounts');
  return res.data;
}

export async function addDiscount(
  name: string,
  percentage: number,
  adminOnly: boolean = false,
): Promise<Discount> {
  const res = await apiClient.post('/app-settings/discounts', {
    name,
    percentage,
    adminOnly,
  });
  return res.data;
}

export async function updateDiscount(
  id: string,
  name: string,
  percentage: number,
  adminOnly?: boolean,
): Promise<Discount> {
  const res = await apiClient.put(`/app-settings/discounts/${id}`, {
    name,
    percentage,
    adminOnly,
  });
  return res.data;
}

export async function deleteDiscount(id: string): Promise<Discount> {
  const res = await apiClient.delete(`/app-settings/discounts/${id}`);
  return res.data;
}

// File Upload Helpers
async function uploadGenericImage(file: any): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.type || 'image/jpeg',
    name: file.fileName || 'image.jpg',
  } as any);

  const res = await apiClient.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.url;
}

async function uploadCardTypeImage(file: any): Promise<{ imageUrl: string; imageKey: string }> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.type || 'image/jpeg',
    name: file.fileName || 'image.jpg',
  } as any);

  const res = await apiClient.post('/card-types/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

// Payment Methods
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  // Return cached data immediately if available
  if (cachedPaymentMethods !== null) {
    const result = cachedPaymentMethods;
    // Refresh in background
    apiClient.get('/app-settings/payment-methods').then(res => {
      cachedPaymentMethods = res.data || [];
    }).catch(() => { });
    return result;
  }

  const res = await apiClient.get('/app-settings/payment-methods');
  const data = res.data || [];
  cachedPaymentMethods = data;
  return data;
}

export async function addPaymentMethod(
  name: string,
  logoFile?: any,
): Promise<PaymentMethod> {
  let logoUrl = '';
  if (logoFile) {
    logoUrl = await uploadGenericImage(logoFile);
  }

  const res = await apiClient.post('/app-settings/payment-methods', {
    name,
    logo: logoUrl,
  });
  return res.data;
}

export async function updatePaymentMethod(
  id: string,
  name: string,
  logoFile?: any,
): Promise<PaymentMethod> {
  let logoUrl;
  if (logoFile) {
    logoUrl = await uploadGenericImage(logoFile);
  }

  const payload: any = { name };
  if (logoUrl) payload.logo = logoUrl;

  const res = await apiClient.put(`/app-settings/payment-methods/${id}`, payload);
  return res.data;
}

export async function deletePaymentMethod(id: string): Promise<PaymentMethod> {
  const res = await apiClient.delete(`/app-settings/payment-methods/${id}`);
  return res.data;
}

// Card Types
export async function getCardTypes(): Promise<CardType[]> {
  // Return cached data immediately if available
  if (cachedCardTypes !== null) {
    const result = cachedCardTypes;
    // Refresh in background
    apiClient.get('/card-types').then(res => {
      cachedCardTypes = res.data || [];
    }).catch(() => { });
    return result;
  }

  const res = await apiClient.get('/card-types');
  const data = res.data || [];
  cachedCardTypes = data;
  return data;
}

export async function addCardType(
  name: string,
  logoFile?: any,
): Promise<CardType> {
  let imageUrl = '';
  let imageKey = '';

  if (logoFile) {
    const uploadResult = await uploadCardTypeImage(logoFile);
    imageUrl = uploadResult.imageUrl;
    imageKey = uploadResult.imageKey;
  }

  const res = await apiClient.post('/card-types', {
    name,
    logo: imageUrl, // for backward compatibility/display
    imageUrl,
    imageKey,
    appSettingsId: (await getAppSettings()).id, // In a real scenario we might pass this differently or backend handles it
  });
  // Invalidate cache
  await AsyncStorage.removeItem('@card_types');
  return res.data;
}

export async function updateCardType(
  id: string,
  name: string,
  logoFile?: any,
): Promise<CardType> {
  let imageUrl;
  let imageKey;

  if (logoFile) {
    const uploadResult = await uploadCardTypeImage(logoFile);
    imageUrl = uploadResult.imageUrl;
    imageKey = uploadResult.imageKey;
  }

  const payload: any = { name };
  if (imageUrl) {
    payload.logo = imageUrl;
    payload.imageUrl = imageUrl;
    payload.imageKey = imageKey;
  }

  const res = await apiClient.patch(`/card-types/${id}`, payload);
  // Invalidate cache
  await AsyncStorage.removeItem('@card_types');
  return res.data;
}

export async function deleteCardType(id: string): Promise<CardType> {
  const res = await apiClient.delete(`/card-types/${id}`);
  // Invalidate cache
  await AsyncStorage.removeItem('@card_types');
  return res.data;
}

// Loyalty Config
export async function getLoyaltyConfig(): Promise<any> {
  try {
    const res = await apiClient.get('/app-settings/loyalty-config');
    return res.data;
  } catch (error: any) {
    console.warn('Failed to fetch loyalty config, using defaults:', error?.message);
    return {
      enabled: false,
      pointsPerCurrency: 1,
      currencyPerPoint: 1,
      rewards: [],
    };
  }
}

export async function updateLoyaltyConfig(loyaltyConfig: any): Promise<any> {
  const res = await apiClient.put('/app-settings/loyalty-config', loyaltyConfig);
  return res.data;
}

export const salesSettingsService = {
  getAppSettings,
  updateTaxRate,
  updateCurrency,
  getDiscounts,
  addDiscount,
  updateDiscount,
  deleteDiscount,
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getCardTypes,
  addCardType,
  updateCardType,
  deleteCardType,
  getLoyaltyConfig,
  updateLoyaltyConfig,
};
