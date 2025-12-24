import { apiClient } from './apiClient';

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    points: number;
    tier: string;
    totalVisits: number;
    totalSpent: number;
    joinDate: string;
    updatedAt: string;
    // Computed fields from backend
    totalOrders?: number;
}

export interface CustomerStats {
    totalCustomers: number;
    newThisMonth: number;
    tiers: {
        bronze: number;
        silver: number;
        gold: number;
        platinum: number;
    };
}

export interface CustomerOrder {
    id: string;
    orderNumber: number;
    total: number;
    status: string;
    createdAt: string;
    items: {
        name: string;
        quantity: number;
        finalPrice: number;
    }[];
}

export interface PaginatedCustomers {
    customers: Customer[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PaginatedOrders {
    orders: CustomerOrder[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateCustomerDto {
    name: string;
    phone: string;
    email?: string;
}

export interface UpdateCustomerDto {
    name?: string;
    phone?: string;
    email?: string;
    tier?: string;
}

/**
 * Fetch all customers with pagination and search
 */
export const getCustomers = async (
    page: number = 1,
    limit: number = 20,
    search?: string
): Promise<PaginatedCustomers> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) {
        params.append('search', search);
    }

    const response = await apiClient.get(`/customers?${params.toString()}`);
    return response.data;
};

/**
 * Get customer statistics
 */
export const getCustomerStats = async (): Promise<CustomerStats> => {
    const response = await apiClient.get('/customers/stats');
    return response.data;
};

/**
 * Get a single customer by ID
 */
export const getCustomerById = async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
};

/**
 * Get customer's order history
 */
export const getCustomerOrders = async (
    customerId: string,
    page: number = 1,
    limit: number = 10
): Promise<PaginatedOrders> => {
    const response = await apiClient.get(
        `/customers/${customerId}/orders?page=${page}&limit=${limit}`
    );
    return response.data;
};

/**
 * Create a new customer
 */
export const createCustomer = async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await apiClient.post('/customers', data);
    return response.data;
};

/**
 * Update a customer
 */
export const updateCustomer = async (
    id: string,
    data: UpdateCustomerDto
): Promise<Customer> => {
    const response = await apiClient.patch(`/customers/${id}`, data);
    return response.data;
};

/**
 * Delete a customer
 */
export const deleteCustomer = async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
};

/**
 * Add/remove loyalty points
 */
export const updateCustomerPoints = async (
    customerId: string,
    points: number
): Promise<Customer> => {
    const response = await apiClient.post(`/customers/${customerId}/points`, {
        points,
    });
    return response.data;
};

/**
 * Search customers
 */
export const searchCustomers = async (query: string): Promise<Customer[]> => {
    const response = await apiClient.get(`/customers/search?q=${encodeURIComponent(query)}`);
    return response.data;
};

import { Share, Alert } from 'react-native';

/**
 * Share customers list as CSV text
 */
export const shareCustomersReport = async (customers: Customer[]) => {
    try {
        if (!customers || customers.length === 0) {
            Alert.alert('No Data', 'There are no customers to export.');
            return;
        }

        // 1. Create CSV Header
        const headers = [
            'Name',
            'Phone',
            'Email',
            'Tier',
            'Points',
            'Total Visits',
            'Total Spent (JOD)',
            'Join Date'
        ].join(',');

        // 2. Create CSV Rows
        const rows = customers.map(c => {
            // Escape values that might contain commas
            const name = `"${c.name.replace(/"/g, '""')}"`;
            const email = c.email ? `"${c.email}"` : '';
            
            return [
                name,
                c.phone,
                email,
                c.tier,
                c.points,
                c.totalVisits,
                c.totalSpent.toFixed(2),
                new Date(c.joinDate).toISOString().split('T')[0]
            ].join(',');
        }).join('\n');

        // 3. Combine
        const csvContent = `${headers}\n${rows}`;

        // 4. Share
        await Share.share({
            title: 'Customer List',
            message: csvContent,
        }, {
            dialogTitle: 'Export Customer List',
            subject: 'customers.csv'
        });

        return true;
    } catch (error) {
        console.error('Export failed:', error);
        Alert.alert('Export Failed', 'Could not share the list.');
        return false;
    }
};
