import { apiClient } from './apiClient';

export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  trackStock: boolean;
  availableStock?: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateItemDto {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isAvailable?: boolean;
  trackStock?: boolean;
  availableStock?: number;
}

export interface UpdateItemDto {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isAvailable?: boolean;
  trackStock?: boolean;
  availableStock?: number;
}

class ItemsService {
  async getAll(): Promise<Item[]> {
    try {
      const response = await apiClient.get('/api/items');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get items:', error.response?.data || error.message);
      throw error;
    }
  }

  async getById(itemId: string): Promise<Item> {
    try {
      const response = await apiClient.get(`/api/items/${itemId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get item:', error.response?.data || error.message);
      throw error;
    }
  }

  async create(itemData: CreateItemDto): Promise<Item> {
    try {
      const response = await apiClient.post('/api/items', itemData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create item:', error.response?.data || error.message);
      throw error;
    }
  }

  async update(itemId: string, updates: UpdateItemDto): Promise<Item> {
    try {
      const response = await apiClient.patch(`/api/items/${itemId}`, updates);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update item:', error.response?.data || error.message);
      throw error;
    }
  }

  async delete(itemId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/items/${itemId}`);
    } catch (error: any) {
      console.error('Failed to delete item:', error.response?.data || error.message);
      throw error;
    }
  }

  async uploadImage(itemId: string, imageFile: FormData): Promise<Item> {
    try {
      const response = await apiClient.post(`/api/items/${itemId}/image`, imageFile, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to upload image:', error.response?.data || error.message);
      throw error;
    }
  }

  async deleteImage(itemId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/items/${itemId}/image`);
    } catch (error: any) {
      console.error('Failed to delete image:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const itemsService = new ItemsService();
