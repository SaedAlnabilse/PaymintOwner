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

import { Share, Alert, Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import moment from 'moment-timezone';

/**
 * Share customers list as CSV file saved to device
 */
export const shareCustomersReport = async (customers: Customer[]) => {
    try {
        if (!customers || customers.length === 0) {
            Alert.alert('No Data', 'There are no customers to export.');
            return;
        }

        // Request storage permission on Android
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission',
                        message: 'This app needs access to storage to save CSV files.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert('Permission Denied', 'Storage permission is required to save files.');
                    return false;
                }
            } catch (err) {
                console.warn('Permission request error:', err);
            }
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

        // 4. Create filename with timestamp
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const filename = `Customers_${timestamp}.csv`;

        // 5. Determine file path
        const downloadPath = Platform.OS === 'ios' 
            ? RNFS.DocumentDirectoryPath 
            : RNFS.DownloadDirectoryPath;
        
        const filePath = `${downloadPath}/${filename}`;

        // 6. Write file
        await RNFS.writeFile(filePath, csvContent, 'utf8');

        // 7. Show success message and share
        Alert.alert(
            'Export Successful', 
            `CSV file saved to:\n${Platform.OS === 'ios' ? 'Files app' : 'Downloads folder'}\n\nFilename: ${filename}`,
            [
                {
                    text: 'Share',
                    onPress: async () => {
                        try {
                            await Share.share({
                                title: 'Customer List',
                                url: Platform.OS === 'ios' ? `file://${filePath}` : filePath,
                            });
                        } catch (shareError) {
                            console.error('Share error:', shareError);
                        }
                    }
                },
                { text: 'OK', style: 'default' }
            ]
        );

        return true;
    } catch (error) {
        console.error('Export failed:', error);
        Alert.alert('Export Failed', `Could not save the customer list: ${(error as Error).message || 'Unknown error'}`);
        return false;
    }
};
