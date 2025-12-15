import { apiClient } from './apiClient';

export interface Discount {
    id: string;
    name: string;
    percentage: number;
    appSettingsId: string;
}

export interface CreateDiscountDto {
    name: string;
    percentage: number;
}

export interface UpdateDiscountDto {
    name?: string;
    percentage?: number;
}

export interface DiscountStats {
    totalDiscounts: number;
    activeOrders: number;
    totalSaved: number;
}

/**
 * Get all discounts
 */
export const getDiscounts = async (): Promise<Discount[]> => {
    const response = await apiClient.get('/api/app-settings/discounts');
    return response.data;
};

/**
 * Create a new discount
 */
export const createDiscount = async (data: CreateDiscountDto): Promise<Discount> => {
    const response = await apiClient.post('/api/app-settings/discounts', data);
    return response.data;
};

/**
 * Update a discount
 */
export const updateDiscount = async (
    id: string,
    data: UpdateDiscountDto
): Promise<Discount> => {
    const response = await apiClient.put(`/api/app-settings/discounts/${id}`, data);
    return response.data;
};

/**
 * Delete a discount
 */
export const deleteDiscount = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/app-settings/discounts/${id}`);
};

/**
 * Get discount usage stats (orders that used this discount)
 */
export const getDiscountUsage = async (discountId: string): Promise<{ count: number; totalSaved: number }> => {
    try {
        // This would need a backend endpoint - for now return mock data
        // TODO: Add backend endpoint for discount usage stats
        return { count: 0, totalSaved: 0 };
    } catch (error) {
        return { count: 0, totalSaved: 0 };
    }
};
