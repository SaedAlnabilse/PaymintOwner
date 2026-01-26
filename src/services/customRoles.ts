import { apiClient } from './apiClient';

export interface CustomRole {
  id: string;
  name: string;
  baseRole: string;
  permissions: string[];
  backofficePermissions: string[];
  allowedDiscounts: string[];
  allDiscounts: boolean;
  // Access Control
  posAccess: boolean;
  backofficeAccess: boolean;
}

export const getCustomRoles = async (establishmentId: string): Promise<CustomRole[]> => {
  const response = await apiClient.get(`/api/custom-roles/${establishmentId}`);
  return response.data;
};
