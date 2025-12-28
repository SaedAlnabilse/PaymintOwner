import { apiClient } from './apiClient';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateCategoryDto {
  name: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
}

class CategoriesService {
  async getAll(): Promise<Category[]> {
    try {
      const response = await apiClient.get('/api/categories');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get categories:', error.response?.data || error.message);
      throw error;
    }
  }

  async create(data: CreateCategoryDto): Promise<Category> {
    try {
      const response = await apiClient.post('/api/categories', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create category:', error.response?.data || error.message);
      throw error;
    }
  }

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    try {
      const response = await apiClient.patch(`/api/categories/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update category:', error.response?.data || error.message);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/categories/${id}`);
    } catch (error: any) {
      console.error('Failed to delete category:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const categoriesService = new CategoriesService();
