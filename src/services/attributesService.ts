import { apiClient } from './apiClient';

// Types
export interface SubAttribute {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  attributeId: string;
}

export interface Attribute {
  id: string;
  name: string;
  inputType: 'SINGLE_SELECT' | 'MULTI_SELECT';
  isRequired: boolean;
  subAttributes: SubAttribute[];
}

export interface CreateAttributeDto {
  name: string;
  inputType: 'SINGLE_SELECT' | 'MULTI_SELECT';
  isRequired?: boolean;
}

export interface UpdateAttributeDto {
  name?: string;
  inputType?: 'SINGLE_SELECT' | 'MULTI_SELECT';
  isRequired?: boolean;
}

export interface CreateSubAttributeDto {
  name: string;
  price?: number;
  isAvailable?: boolean;
}

export interface UpdateSubAttributeDto {
  name?: string;
  price?: number;
  isAvailable?: boolean;
}

// Base path for attributes API
const BASE_PATH = '/api/attributes';

export const attributesService = {
  // Get all attributes
  async getAll(): Promise<Attribute[]> {
    const res = await apiClient.get(BASE_PATH);
    return res.data;
  },

  // Get single attribute
  async getById(id: string): Promise<Attribute> {
    const res = await apiClient.get(`${BASE_PATH}/${id}`);
    return res.data;
  },

  // Create attribute
  async create(data: CreateAttributeDto): Promise<Attribute> {
    const res = await apiClient.post(BASE_PATH, data);
    return res.data;
  },

  // Update attribute
  async update(id: string, data: UpdateAttributeDto): Promise<Attribute> {
    const res = await apiClient.put(`${BASE_PATH}/${id}`, data);
    return res.data;
  },

  // Delete attribute
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${id}`);
  },

  // Create sub-attribute
  async createSubAttribute(attributeId: string, data: CreateSubAttributeDto): Promise<SubAttribute> {
    const res = await apiClient.post(`${BASE_PATH}/${attributeId}/sub-attributes`, data);
    return res.data;
  },

  // Update sub-attribute
  async updateSubAttribute(subAttributeId: string, data: UpdateSubAttributeDto): Promise<SubAttribute> {
    const res = await apiClient.put(`${BASE_PATH}/sub-attributes/${subAttributeId}`, data);
    return res.data;
  },

  // Delete sub-attribute
  async deleteSubAttribute(subAttributeId: string): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/sub-attributes/${subAttributeId}`);
  },
};
