import { apiClient } from './apiClient';
import {
  TopSellingItem,
  Employee,
  OrderHistoryItem,
  OrderHistoryFilters,
  LiveShiftReport,
  HistoricalSummary,
  HistoricalOrder,
  PayInPayOutLogResponse,
  ShiftSummary,
  OrderDetails,
} from '../types/reports';

export const getSalesSummary = async (
  startDate: string,
  endDate: string,
  employeeId?: string,
): Promise<HistoricalSummary> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (employeeId) {
    params.append('employeeId', employeeId);
  }

  console.log('🔌 API: Calling /reports/historical-summary with params:', params.toString());
  try {
    const response = await apiClient.get(
      `/reports/historical-summary?${params.toString()}`,
    );
    console.log('✅ API: Historical summary response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('❌ API: Historical summary error:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchOrdersHistory = async (
  startDate: string,
  endDate: string,
  options: {
    employeeId?: string;
    page?: number;
    limit?: number;
    status?: string;
  } = {},
): Promise<HistoricalOrder[]> => {
  const { employeeId, page, limit, status } = options;
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (employeeId) params.append('employeeId', employeeId);
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());
  if (status) params.append('status', status);

  const fullUrl = `/reports/orders-history?${params.toString()}`;
  console.log('🌐 Orders API Call:', fullUrl);
  console.log('🌐 Orders API params:', {
    startDate,
    endDate,
    employeeId,
    page,
    limit,
    status,
  });

  const response = await apiClient.get(fullUrl);
  return response.data;
};

export const getTopSellingItems = async (
  startDate: string,
  endDate: string,
  employeeId?: string,
): Promise<TopSellingItem[]> => {
  const params = new URLSearchParams();
  params.append('startDate', startDate);
  params.append('endDate', endDate);
  if (employeeId) params.append('employeeId', employeeId);

  console.log('🔌 API: Calling /reports/top-selling-items with params:', params.toString());
  try {
    const response = await apiClient.get(
      `/reports/top-selling-items?${params.toString()}`,
    );
    console.log('✅ API: Top selling items response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('❌ API: Top selling items error:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get('/reports/employees');
  return response.data;
};

export const getLiveShiftReport = async (employeeId?: string): Promise<LiveShiftReport> => {
  if (!employeeId) {
    // No employee ID provided, return empty response
    return { type: 'NO_SHIFT', shiftStartTime: null };
  }

  try {
    // Use the /reports/shifts endpoint to check for active shifts
    // Query for shifts in a wide date range to find any currently open shift
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
    const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow

    const params = new URLSearchParams({
      employeeId,
      startDate,
      endDate,
    });

    const response = await apiClient.get(`/reports/shifts?${params.toString()}`);
    const shifts = response.data;

    // Find an active (OPEN) shift
    const activeShift = shifts.find((shift: any) => shift.status === 'OPEN' || !shift.endTime);

    if (activeShift) {
      return {
        type: 'CURRENT_SHIFT',
        shiftStartTime: activeShift.startTime,
        shift: activeShift,
      };
    }

    return { type: 'NO_SHIFT', shiftStartTime: null };
  } catch (error: any) {
    // Silently handle errors - return null shift status instead of throwing
    // This prevents console spam when employees don't have shifts
    const is404 = error.response?.status === 404;
    if (!is404) {
      console.warn('Could not fetch shift status:', error.message);
    }
    return { type: 'NO_SHIFT', shiftStartTime: null };
  }
};

export const fetchPayInPayOutLog = async (
  startDate: string,
  endDate: string,
  options: { employeeId?: string; page?: number; limit?: number } = {},
): Promise<PayInPayOutLogResponse> => {
  const { employeeId, page, limit } = options;
  const params = new URLSearchParams({
    startDate,
    endDate,
  });
  if (employeeId) params.append('employeeId', employeeId);
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  const response = await apiClient.get(`/reports/pay-in-pay-out?${params.toString()}`);
  return response.data;
};

export const fetchEmployeeShifts = async (
  startDate: string,
  endDate: string,
  employeeId?: string,
): Promise<ShiftSummary[]> => {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (employeeId) {
      params.append('employeeId', employeeId);
    }

    const response = await apiClient.get(`/reports/shifts?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch employee shifts:', error);
    return [];
  }
};

export const fetchOrderDetails = async (
  orderId: string,
): Promise<OrderDetails> => {
  const response = await apiClient.get(`/reports/orders/${orderId}`);
  return response.data;
};

export const fetchUserName = async (userId: string): Promise<string> => {
  const response = await apiClient.get(`/api/users/name/${userId}`);
  return response.data.name;
};

/**
 * Get sales comparison between two periods (e.g., today vs yesterday)
 */
export interface SalesComparison {
  current: {
    totalSales: number;
    orderCount: number;
    averageSale: number;
  };
  previous: {
    totalSales: number;
    orderCount: number;
    averageSale: number;
  };
  percentageChange: {
    sales: number;
    orders: number;
    average: number;
  };
}

export const getSalesComparison = async (
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string
): Promise<SalesComparison> => {
  try {
    const [currentData, previousData] = await Promise.all([
      getSalesSummary(currentStart, currentEnd),
      getSalesSummary(previousStart, previousEnd),
    ]);

    const current = {
      totalSales: currentData.totalNetSales || 0,
      orderCount: currentData.totalOrders || 0,
      averageSale: currentData.totalOrders > 0 ? (currentData.totalNetSales || 0) / currentData.totalOrders : 0,
    };

    const previous = {
      totalSales: previousData.totalNetSales || 0,
      orderCount: previousData.totalOrders || 0,
      averageSale: previousData.totalOrders > 0 ? (previousData.totalNetSales || 0) / previousData.totalOrders : 0,
    };

    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current,
      previous,
      percentageChange: {
        sales: calculateChange(current.totalSales, previous.totalSales),
        orders: calculateChange(current.orderCount, previous.orderCount),
        average: calculateChange(current.averageSale, previous.averageSale),
      },
    };
  } catch (error) {
    console.error('Failed to get sales comparison:', error);
    return {
      current: { totalSales: 0, orderCount: 0, averageSale: 0 },
      previous: { totalSales: 0, orderCount: 0, averageSale: 0 },
      percentageChange: { sales: 0, orders: 0, average: 0 },
    };
  }
};

// Import items service to resolve category names
import { itemsService } from './itemsService';

/**
 * Get sales breakdown by category
 */
export interface CategorySales {
  categoryName: string;
  totalSales: number;
  itemCount: number;
  percentage: number;
}

export const getSalesByCategory = async (
  startDate: string,
  endDate: string
): Promise<CategorySales[]> => {
  try {
    // 1. Get top selling items
    const topItems = await getTopSellingItems(startDate, endDate);

    // 2. Fetch all items (to look up category names from item definitions if needed)
    // Note: Ideally, the backend should return category names in top-selling-items.
    // However, if it returns category IDs or null, we might need to map them manually
    // or rely on what's returned.
    //
    // Let's inspect what topItems actually has. If `categoryName` is missing,
    // we might need to fetch item details.

    // For robust solution: fetch full item list to map IDs -> Categories if backend fails us
    const allItems = await itemsService.getAll();
    const itemMap = new Map(allItems.map(i => [i.id, i]));

    // We also need categories... but typically item.category.name or similar is needed.
    // Since itemsService returns Item which has categoryId, we would need categories too.
    // Let's try to assume the backend *should* return categoryName.
    // If "Uncategorized" is showing, it means `item.categoryName` is undefined/null.
    // Let's try to recover it from the item definition if possible.

    // Fetch categories to map ID -> Name
    const categoriesResponse = await apiClient.get('/api/categories');
    const categoriesList = categoriesResponse.data || [];
    const categoryNameMap = new Map(categoriesList.map((c: any) => [c.id, c.name]));

    const categoryMap = new Map<string, { sales: number; count: number }>();
    let totalSales = 0;

    topItems.forEach(item => {
      // Logic to resolve category name:
      // 1. Try `categoryName` from the report response
      // 2. If valid item ID, look up item -> categoryId -> categoryName
      // 3. Fallback to 'Uncategorized'

      let resolvedCategoryName = (item as any).categoryName;

      if (!resolvedCategoryName || resolvedCategoryName === 'Uncategorized') {
        const fullItem = itemMap.get(item.itemId);
        if (fullItem && fullItem.categoryId) {
          resolvedCategoryName = categoryNameMap.get(fullItem.categoryId);
        }
      }

      const category = resolvedCategoryName || 'Uncategorized';

      const existing = categoryMap.get(category) || { sales: 0, count: 0 };
      existing.sales += item.totalRevenue || 0;
      existing.count += item.totalQuantitySold || 0;
      categoryMap.set(category, existing);
      totalSales += item.totalRevenue || 0;
    });

    const categories: CategorySales[] = [];
    categoryMap.forEach((value, key) => {
      categories.push({
        categoryName: key,
        totalSales: value.sales,
        itemCount: value.count,
        percentage: totalSales > 0 ? (value.sales / totalSales) * 100 : 0,
      });
    });

    // Sort by sales descending
    return categories.sort((a, b) => b.totalSales - a.totalSales);
  } catch (error) {
    console.error('Failed to get sales by category:', error);
    return [];
  }
};

/**
 * Get hourly sales breakdown for chart visualization
 */
export interface HourlySales {
  hour: number;
  sales: number;
  orderCount: number;
}

export const getHourlySales = async (
  startDate: string,
  endDate: string
): Promise<HourlySales[]> => {
  try {
    // Fetch orders for the date range
    const orders = await fetchOrdersHistory(startDate, endDate, {
      page: 1,
      limit: 500,
      status: 'COMPLETED',
    });

    // Initialize hourly buckets
    const hourlyData: HourlySales[] = [];
    for (let hour = 0; hour < 24; hour++) {
      hourlyData.push({ hour, sales: 0, orderCount: 0 });
    }

    // Aggregate orders by hour
    orders.forEach(order => {
      if (!order.isRefunded && order.status === 'COMPLETED') {
        const orderDate = new Date(order.createdAt);
        const hour = orderDate.getHours();
        if (hour >= 0 && hour < 24) {
          hourlyData[hour].sales += Math.abs(order.total || 0);
          hourlyData[hour].orderCount += 1;
        }
      }
    });

    return hourlyData;
  } catch (error) {
    console.error('Failed to get hourly sales:', error);
    // Return empty hourly data
    return Array.from({ length: 24 }, (_, hour) => ({ hour, sales: 0, orderCount: 0 }));
  }
};

import { Share, Alert } from 'react-native';
import moment from 'moment-timezone';

/**
 * Share orders report as CSV text
 */
export const shareOrdersReport = async (orders: HistoricalOrder[], periodName: string = 'Report') => {
  try {
    if (!orders || orders.length === 0) {
      Alert.alert('No Data', 'There are no orders to export for this period.');
      return;
    }

    // 1. Create CSV Header
    const headers = [
      'Order No',
      'Date',
      'Time',
      'Total (JOD)',
      'Status',
      'Items',
      'Employee',
      'Payment'
    ].join(',');

    // 2. Create CSV Rows
    const rows = orders.map(order => {
      const date = moment(order.createdAt);
      // Clean up item names to avoid CSV breaking
      const itemsSummary = (order.items || [])
        .map((i: any) => `${i.quantity}x ${i.name}`)
        .join('; ')
        .replace(/,/g, ' '); // Remove commas from item names

      return [
        order.orderNumber,
        date.format('YYYY-MM-DD'),
        date.format('HH:mm'),
        order.total.toFixed(2),
        order.status,
        `"${itemsSummary}"`, // Quote items to handle special chars
        order.employeeName || 'Unknown',
        order.paymentMethod || 'CASH'
      ].join(',');
    }).join('\n');

    // 3. Combine
    const csvContent = `${headers}\n${rows}`;

    // 4. Share
    const title = `Sales Report - ${periodName}`;
    
    await Share.share({
      title: title,
      message: csvContent, 
    }, {
      dialogTitle: 'Export Sales Report',
      subject: `${title}.csv`
    });

    return true;
  } catch (error) {
    console.error('Export failed:', error);
    Alert.alert('Export Failed', 'Could not share the report.');
    return false;
  }
};
