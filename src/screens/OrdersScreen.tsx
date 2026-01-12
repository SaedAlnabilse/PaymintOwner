import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import moment from 'moment-timezone';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { apiClient } from '../services/apiClient';
import OrderDetailsModal from '../components/reports/OrderDetailsModal';
import { OrderDetails } from '../types/reports';

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  customer?: {
    name: string;
    phone: string;
  };
  user?: {
    username: string;
  };
  note?: string;
  status?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
];

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Held', value: 'HELD' },
  { label: 'Refunded', value: 'REFUNDED' },
];

const OrdersScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Convert Order to OrderDetails format for the modal
  const orderToOrderDetails = (order: Order): OrderDetails => ({
    id: order.id,
    orderNumber: parseInt(order.orderNumber) || 0,
    totalAmount: order.total,
    status: order.status || order.paymentStatus,
    items: order.items.map(item => ({
      id: item.id,
      cartItemId: item.id,
      itemId: item.id,
      productId: item.id,
      name: item.name,
      basePrice: item.price,
      finalPrice: item.price,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.quantity * item.price,
      selectedSubAttributeIds: [],
    })),
    createdAt: order.createdAt,
    total: order.total,
    subtotal: order.subtotal,
    tax: order.tax,
    paymentMethod: order.paymentMethod as any,
    note: order.note,
    discount: order.discount ? { id: '', name: 'Discount', percentage: order.discount } : null,
    discountAmount: order.discount,
    taxes: [{ id: '', name: 'Tax', rate: 0, is_active: true }],
    employeeName: order.user?.username,
  });

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, dateFilter]);

  const fetchOrders = async () => {
    try {
      if (!refreshing) setIsLoading(true);

      if (statusFilter === 'HELD') {
        // Fetch held orders separately
        const response = await apiClient.get('/api/held-orders');
        const heldOrders = (response.data || []).map((h: any) => ({
          id: h.id,
          orderNumber: h.nickname,
          total: h.orderData?.total || 0,
          subtotal: h.orderData?.subtotal || 0,
          tax: h.orderData?.tax || 0,
          discount: h.orderData?.discount?.amount || 0,
          paymentMethod: 'N/A',
          paymentStatus: 'HELD',
          status: 'HELD',
          createdAt: h.pinnedAt,
          items: (h.orderData?.items || []).map((item: any) => ({
            id: item.itemId,
            name: item.name,
            quantity: item.quantity,
            price: item.basePrice,
            total: item.finalPrice,
          })),
          user: {
            username: h.heldBy?.username || 'Unknown',
          },
          note: h.orderData?.note,
        }));
        setOrders(heldOrders);
        setTotalPages(1);
        return;
      }

      const params: any = {
        page,
        limit: 20,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const now = moment().tz('Asia/Amman');
      let startDate: moment.Moment;
      let endDate: moment.Moment = now.clone().endOf('day');

      switch (dateFilter) {
        case 'week':
          startDate = now.clone().startOf('isoWeek');
          endDate = now.clone().endOf('isoWeek');
          break;
        case 'month':
          startDate = now.clone().startOf('month');
          endDate = now.clone().endOf('month');
          break;
        case 'all':
          startDate = now.clone().subtract(10, 'years');
          break;
        case 'today':
        default:
          startDate = now.clone().startOf('day');
          break;
      }

      params.startDate = startDate.toISOString();
      params.endDate = endDate.toISOString();

      const response = await apiClient.get('/reports/orders-history', { params });
      setOrders(response.data.orders || response.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: any) {
      console.error('Orders fetch error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const searchOrder = async () => {
    if (!searchQuery.trim()) {
      fetchOrders();
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/orders/by-number/${searchQuery}`);
      if (response.data) {
        setOrders([response.data]);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [statusFilter, dateFilter]);

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} JOD`;
  };

  const formatDate = (dateString: string) => {
    return moment(dateString).tz('Asia/Amman').format('MMM D, h:mm A');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7' };
      case 'PENDING':
      case 'HELD':
        return { bg: '#FFF3E0', color: '#EF6C00', border: '#FFCC80' };
      case 'REFUNDED':
        return { bg: '#FFEBEE', color: '#C62828', border: '#EF9A9A' };
      default:
        return { bg: '#F5F5F5', color: '#757575', border: '#E0E0E0' };
    }
  };

  const handleExport = async () => {
    try {
      const csvContent = orders
        .map(
          (o) =>
            `${o.orderNumber},${formatDate(o.createdAt)},${o.customer?.name || 'Walk-in'},${o.total},${o.paymentStatus || o.status},${o.paymentMethod}`
        )
        .join('\n');

      const header = 'Order #,Date,Customer,Total (JOD),Status,Payment Method\n';

      await Share.share({
        message: header + csvContent,
        title: 'Orders Export',
      });
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusStyle(item.paymentStatus || item.status || 'PENDING');

    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: COLORS.cardBackground }]}
        onPress={() => setSelectedOrder(orderToOrderDetails(item))}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIconContainer}>
            <Icon name="receipt" size={24} color="#7CC39F" />
          </View>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderNumber, { color: COLORS.textPrimary }]}>
              #{item.orderNumber}
            </Text>
            <Text style={[styles.orderDate, { color: COLORS.textSecondary }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {item.paymentStatus || item.status}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderDetailItem}>
            <Text style={[styles.orderDetailLabel, { color: COLORS.textSecondary }]}>Customer</Text>
            <Text style={[styles.orderDetailValue, { color: COLORS.textPrimary }]}>
              {item.customer?.name || 'Walk-in'}
            </Text>
          </View>
          <View style={styles.orderDetailItem}>
            <Text style={[styles.orderDetailLabel, { color: COLORS.textSecondary }]}>Staff</Text>
            <Text style={[styles.orderDetailValue, { color: COLORS.textPrimary }]}>
              {item.user?.username || 'POS'}
            </Text>
          </View>
          <View style={[styles.orderDetailItem, { alignItems: 'flex-end' }]}>
            <Text style={[styles.orderDetailLabel, { color: COLORS.textSecondary }]}>Total</Text>
            <Text style={[styles.orderTotal, { color: COLORS.primary }]}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.paymentMethodBadge}>
            <Icon name="credit-card-outline" size={14} color={COLORS.textSecondary} />
            <Text style={[styles.paymentMethodText, { color: COLORS.textSecondary }]}>
              {item.paymentMethod}
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const stats = {
    totalVolume: orders.reduce((acc, o) => acc + (o.total || 0), 0),
    ordersCount: orders.length,
    pendingCount: orders.filter((o) => o.status === 'HELD' || o.paymentStatus === 'PENDING').length,
  };

  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitle}>
              <View style={styles.headerIconContainer}>
                <Icon name="shopping" size={28} color="#000" />
              </View>
              <View>
                <Text style={[styles.title, { color: COLORS.textPrimary }]}>Orders History</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                  Track all transactions
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: COLORS.backgroundSecondary }]}
                onPress={handleExport}
              >
                <FeatherIcon name="download" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: COLORS.backgroundSecondary }]}
                onPress={onRefresh}
              >
                <FeatherIcon
                  name="refresh-cw"
                  size={20}
                  color={COLORS.textSecondary}
                  style={refreshing ? styles.spinning : undefined}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="trending-up" size={20} color="#2E7D32" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Volume</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>
              {formatCurrency(stats.totalVolume)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="receipt" size={20} color="#1976D2" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Orders</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.ordersCount}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="clock-outline" size={20} color="#EF6C00" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Pending</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.pendingCount}</Text>
          </View>
        </View>

        {/* Search & Filters */}
        <View style={[styles.filtersContainer, { backgroundColor: COLORS.cardBackground }]}>
          <View style={[styles.searchContainer, { backgroundColor: COLORS.backgroundSecondary }]}>
            <FeatherIcon name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: COLORS.textPrimary }]}
              placeholder="Search by order ID..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchOrder}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FeatherIcon name="x" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: COLORS.backgroundSecondary }]}
            onPress={() => setShowFilters(true)}
          >
            <FeatherIcon name="filter" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Active Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChipsContainer}
          contentContainerStyle={styles.filterChipsContent}
        >
          {DATE_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterChip,
                dateFilter === filter.value && styles.filterChipActive,
                { borderColor: dateFilter === filter.value ? '#7CC39F' : COLORS.border },
              ]}
              onPress={() => {
                setDateFilter(filter.value);
                setPage(1);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: dateFilter === filter.value ? '#7CC39F' : COLORS.textSecondary },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.filterDivider} />
          {STATUS_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterChip,
                statusFilter === filter.value && styles.filterChipActive,
                { borderColor: statusFilter === filter.value ? '#7CC39F' : COLORS.border },
              ]}
              onPress={() => {
                setStatusFilter(filter.value);
                setPage(1);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: statusFilter === filter.value ? '#7CC39F' : COLORS.textSecondary },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Orders List */}
        {isLoading && orders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7CC39F" />
            <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>
              Loading orders...
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Icon name="receipt" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No orders found</Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
              Try adjusting your filters or search query.
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />
            }
            ListFooterComponent={
              totalPages > 1 ? (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      { backgroundColor: COLORS.backgroundSecondary },
                      page === 1 && styles.paginationButtonDisabled,
                    ]}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <FeatherIcon name="chevron-left" size={20} color={page === 1 ? '#ccc' : COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.paginationText, { color: COLORS.textSecondary }]}>
                    Page <Text style={{ color: COLORS.textPrimary, fontWeight: '700' }}>{page}</Text> of{' '}
                    {totalPages}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      { backgroundColor: '#7CC39F' },
                      page === totalPages && styles.paginationButtonDisabled,
                    ]}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <FeatherIcon name="chevron-right" size={20} color={page === totalPages ? '#ccc' : '#000'} />
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            visible={!!selectedOrder}
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#7CC39F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    gap: 10,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipsContainer: {
    marginBottom: 12,
  },
  filterChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: 'rgba(124, 195, 159, 0.1)',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  orderDate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderDetails: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  orderDetailItem: {
    flex: 1,
  },
  orderDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  paginationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
});

export default OrdersScreen;
