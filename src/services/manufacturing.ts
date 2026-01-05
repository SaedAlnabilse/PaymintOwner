import { apiClient } from './apiClient';
import {
  RawMaterial,
  SubRecipe,
  FinalRecipe,
} from '../types/manufacturing';

// Base path for manufacturing API
const BASE_PATH = '/api/manufacturing';

export interface CreateRawMaterialDto {
  name: string;
  unit: string;
  quantity?: number;
  costPerUnit?: number;
  lowStockThreshold?: number;
}

export interface UpdateRawMaterialDto {
  name?: string;
  unit?: string;
  quantity?: number;
  costPerUnit?: number;
  lowStockThreshold?: number;
}

export const manufacturingService = {
  // Raw Materials
  async getRawMaterials(): Promise<RawMaterial[]> {
    const res = await apiClient.get(`${BASE_PATH}/raw-materials`);
    return res.data;
  },

  async createRawMaterial(data: CreateRawMaterialDto): Promise<RawMaterial> {
    const res = await apiClient.post(`${BASE_PATH}/raw-materials`, data);
    return res.data;
  },

  async updateRawMaterial(id: string, data: UpdateRawMaterialDto): Promise<RawMaterial> {
    const res = await apiClient.put(`${BASE_PATH}/raw-materials/${id}`, data);
    return res.data;
  },

  async restockRawMaterial(id: string, amount: number): Promise<RawMaterial> {
    const res = await apiClient.post(`${BASE_PATH}/raw-materials/${id}/restock`, { amount });
    return res.data;
  },

  async deleteRawMaterial(id: string): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/raw-materials/${id}`);
  },

  // ============================================
  // SUB-RECIPES API
  // ============================================

  async getSubRecipes(): Promise<SubRecipe[]> {
    const res = await apiClient.get(`${BASE_PATH}/sub-recipes`);
    // Transform backend response to frontend format
    return res.data.map((recipe: any) => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      yield: recipe.yield,
      yieldUnit: recipe.yieldUnit,
      quantity: recipe.quantity || 0,
      ingredients: recipe.ingredients.map((ing: any) => ({
        ingredientId: ing.rawMaterialId,
        ingredientName: ing.rawMaterial?.name || '',
        quantity: ing.quantity,
        unit: ing.rawMaterial?.unit || '',
      })),
    }));
  },

  async createSubRecipe(data: {
    name: string;
    description?: string;
    yield?: number;
    yieldUnit?: string;
    ingredients: { rawMaterialId: string; quantity: number }[];
  }): Promise<SubRecipe> {
    const res = await apiClient.post(`${BASE_PATH}/sub-recipes`, data);
    return {
      id: res.data.id,
      name: res.data.name,
      description: res.data.description,
      yield: res.data.yield,
      yieldUnit: res.data.yieldUnit,
      quantity: res.data.quantity || 0,
      ingredients: res.data.ingredients.map((ing: any) => ({
        ingredientId: ing.rawMaterialId,
        ingredientName: ing.rawMaterial?.name || '',
        quantity: ing.quantity,
        unit: ing.rawMaterial?.unit || '',
      })),
    };
  },

  async updateSubRecipe(
    id: string,
    data: {
      name?: string;
      description?: string;
      yield?: number;
      yieldUnit?: string;
      ingredients?: { rawMaterialId: string; quantity: number }[];
    }
  ): Promise<SubRecipe> {
    const res = await apiClient.put(`${BASE_PATH}/sub-recipes/${id}`, data);
    return {
      id: res.data.id,
      name: res.data.name,
      description: res.data.description,
      yield: res.data.yield,
      yieldUnit: res.data.yieldUnit,
      quantity: res.data.quantity || 0,
      ingredients: res.data.ingredients.map((ing: any) => ({
        ingredientId: ing.rawMaterialId,
        ingredientName: ing.rawMaterial?.name || '',
        quantity: ing.quantity,
        unit: ing.rawMaterial?.unit || '',
      })),
    };
  },

  async manufactureSubRecipe(id: string, batches: number): Promise<SubRecipe> {
    const res = await apiClient.post(`${BASE_PATH}/sub-recipes/${id}/manufacture`, { batches });
    return {
      id: res.data.id,
      name: res.data.name,
      description: res.data.description,
      yield: res.data.yield,
      yieldUnit: res.data.yieldUnit,
      quantity: res.data.quantity || 0,
      ingredients: res.data.ingredients.map((ing: any) => ({
        ingredientId: ing.rawMaterialId,
        ingredientName: ing.rawMaterial?.name || '',
        quantity: ing.quantity,
        unit: ing.rawMaterial?.unit || '',
      })),
    };
  },

  async deleteSubRecipe(id: string): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/sub-recipes/${id}`);
  },

  // ============================================
  // FINAL RECIPES API
  // ============================================

  async getFinalRecipes(): Promise<FinalRecipe[]> {
    const res = await apiClient.get(`${BASE_PATH}/final-recipes`);
    // Transform backend response to frontend format
    return res.data.map((recipe: any) => ({
      id: recipe.id,
      menuItemId: recipe.itemId,
      menuItemName: recipe.item?.name || '',
      ingredients: recipe.ingredients.map((ing: any) => ({
        ingredientId: ing.rawMaterialId || ing.subRecipeId,
        ingredientName: ing.rawMaterial?.name || ing.subRecipe?.name || '',
        quantity: ing.quantity,
        unit: ing.rawMaterial?.unit || ing.subRecipe?.yieldUnit || '',
      })),
    }));
  },

  async createFinalRecipe(data: {
    itemId: string;
    ingredients: { rawMaterialId?: string; subRecipeId?: string; quantity: number }[];
  }): Promise<FinalRecipe> {
    const res = await apiClient.post(`${BASE_PATH}/final-recipes`, data);
    return {
      id: res.data.id,
      menuItemId: res.data.itemId,
      menuItemName: res.data.item?.name || '',
      ingredients: res.data.ingredients.map((ing: any) => ({
        ingredientId: ing.rawMaterialId || ing.subRecipeId,
        ingredientName: ing.rawMaterial?.name || ing.subRecipe?.name || '',
        quantity: ing.quantity,
        unit: ing.rawMaterial?.unit || ing.subRecipe?.yieldUnit || '',
      })),
    };
  },

  async updateFinalRecipe(
    id: string,
    data: {
      ingredients?: { rawMaterialId?: string; subRecipeId?: string; quantity: number }[];
    }
  ): Promise<FinalRecipe> {
    const res = await apiClient.put(`${BASE_PATH}/final-recipes/${id}`, data);
    return {
      id: res.data.id,
      menuItemId: res.data.itemId,
      menuItemName: res.data.item?.name || '',
      ingredients: res.data.ingredients.map((ing: any) => ({
        ingredientId: ing.rawMaterialId || ing.subRecipeId,
        ingredientName: ing.rawMaterial?.name || ing.subRecipe?.name || '',
        quantity: ing.quantity,
        unit: ing.rawMaterial?.unit || ing.subRecipe?.yieldUnit || '',
      })),
    };
  },

  async deleteFinalRecipe(id: string): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/final-recipes/${id}`);
  },

  async getFinalRecipeByItemId(itemId: string): Promise<FinalRecipe | null> {
    try {
      const res = await apiClient.get(`${BASE_PATH}/final-recipes/by-item/${itemId}`);
      if (!res.data) return null;
      return {
        id: res.data.id,
        menuItemId: res.data.itemId,
        menuItemName: res.data.item?.name || '',
        ingredients: res.data.ingredients.map((ing: any) => ({
          ingredientId: ing.rawMaterialId || ing.subRecipeId,
          ingredientName: ing.rawMaterial?.name || ing.subRecipe?.name || '',
          quantity: ing.quantity,
          unit: ing.rawMaterial?.unit || ing.subRecipe?.yieldUnit || '',
        })),
      };
    } catch (error) {
      return null;
    }
  },

  async checkAvailability(itemId: string, quantity: number = 1): Promise<{
    hasRecipe: boolean;
    canMake: boolean;
    missingIngredients: Array<{
      name: string;
      required: number;
      available: number;
      shortage: number;
    }>;
  }> {
    const res = await apiClient.get(`${BASE_PATH}/check-availability/${itemId}`, {
      params: { quantity },
    });
    return res.data;
  },
};
