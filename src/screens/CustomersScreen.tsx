import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScreenContainer } from '../components/ScreenContainer';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import {
  getCustomers,
  getCustomerStats,
  getCustomerById,
  getCustomerOrders,
  updateCustomerPoints,
  createCustomer,
  updateCustomer,
  Customer,
  CustomerStats,
  CustomerOrder,
} from '../services/customers';
import moment from 'moment-timezone';

const CustomersScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Add/Edit Customer Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  // Fetch customers
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [customersData, statsData] = await Promise.all([
        getCustomers(1, 20, searchQuery || undefined),
        getCustomerStats(),
      ]);

      setCustomers(customersData.customers);
      setTotalPages(customersData.pagination.totalPages);
      setPage(1);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load more customers
  const loadMore = async () => {
    if (page >= totalPages) return;

    try {
      const nextPage = page + 1;
      const data = await getCustomers(nextPage, 20, searchQuery || undefined);
      setCustomers(prev => [...prev, ...data.customers]);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more:', error);
    }
  };

  // Open customer detail
  const openCustomerDetail = async (customer: Customer) => {
    // Set initial data from list
    setSelectedCustomer(customer);
    setCustomerModalVisible(true);
    setLoadingOrders(true);

    try {
      // Fetch fresh customer details (for accurate spent/orders stats) AND orders in parallel
      const [detailedCustomer, ordersData] = await Promise.all([
        getCustomerById(customer.id),
        getCustomerOrders(customer.id, 1, 10)
      ]);

      setSelectedCustomer(detailedCustomer);
      setCustomerOrders(ordersData.orders);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoadingOrders(false);
    }
  };


  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} JOD`;
  };

  // Open Add Customer modal
  const openAddCustomerModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormErrors({});
    setEditModalVisible(true);
  };

  // Open Edit Customer modal
  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone);
    setFormEmail(customer.email || '');
    setFormErrors({});
    setEditModalVisible(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: { name?: string; phone?: string } = {};

    if (!formName.trim()) {
      errors.name = 'Name is required';
    }

    if (!formPhone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!/^\+?[\d\s-]{8,}$/.test(formPhone)) {
      errors.phone = 'Invalid phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save customer
  const handleSaveCustomer = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
        });
        Alert.alert('Success', 'Customer updated successfully');
      } else {
        await createCustomer({
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
        });
        Alert.alert('Success', 'Customer added successfully');
      }
      setEditModalVisible(false);
      fetchData(true);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return '#8B5CF6';
      case 'gold':
        return '#F59E0B';
      case 'silver':
        return '#6B7280';
      default:
        return '#CD7F32';
    }
  };

  // Customer Card Component
  const CustomerCard = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: COLORS.cardBackground }]}
      onPress={() => openCustomerDetail(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: COLORS.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.phone, { color: COLORS.textSecondary }]}>{item.phone}</Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: getTierColor(item.tier) + '20' }]}>
          <Text style={[styles.tierText, { color: getTierColor(item.tier) }]}>{item.tier}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: COLORS.borderLight }]} />

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Visits</Text>
          <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{item.totalVisits}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Spent</Text>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{formatCurrency(item.totalSpent)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Points</Text>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>{item.points}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Customer Detail Modal
  const CustomerDetailModal = () => (
    <Modal
      visible={customerModalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setCustomerModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={() => setCustomerModalVisible(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardView}
        >
          <View style={[styles.modalContent, { backgroundColor: COLORS.cardBackground }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setCustomerModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Customer Details</Text>
                <View style={{ width: 24 }} />
              </View>

              {selectedCustomer && (
                <>
                  {/* Customer Info */}
                  <View style={styles.customerInfo}>
                    <View style={[styles.largeAvatar, { backgroundColor: COLORS.primary }]}>
                      <Text style={styles.largeAvatarText}>
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.customerName, { color: COLORS.textPrimary }]}>
                      {selectedCustomer.name}
                    </Text>
                    <View style={[styles.tierBadge, { backgroundColor: getTierColor(selectedCustomer.tier) + '20' }]}>
                      <Text style={[styles.tierText, { color: getTierColor(selectedCustomer.tier) }]}>
                        {selectedCustomer.tier} Member
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.editCustomerButton, { backgroundColor: COLORS.primary + '15' }]}
                      onPress={() => {
                        setCustomerModalVisible(false);
                        openEditCustomerModal(selectedCustomer);
                      }}
                    >
                      <Icon name="pencil" size={16} color={COLORS.primary} />
                      <Text style={[styles.editCustomerButtonText, { color: COLORS.primary }]}>Edit Customer</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Contact Info */}
                  <View style={[styles.section, { borderColor: COLORS.borderLight }]}>
                    <View style={styles.infoRow}>
                      <Icon name="phone" size={20} color={COLORS.textSecondary} />
                      <Text style={[styles.infoText, { color: COLORS.textPrimary }]}>{selectedCustomer.phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Icon name="calendar" size={20} color={COLORS.textSecondary} />
                      <Text style={[styles.infoText, { color: COLORS.textPrimary }]}>
                        Member since {moment(selectedCustomer.joinDate).format('MMM D, YYYY')}
                      </Text>
                    </View>
                  </View>

                  {/* Stats Grid */}
                  <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: COLORS.primary + '10' }]}>
                      <Icon name="star" size={24} color={COLORS.primary} />
                      <Text style={[styles.statCardValue, { color: COLORS.primary }]}>{selectedCustomer.points}</Text>
                      <Text style={[styles.statCardLabel, { color: COLORS.textSecondary }]}>Points</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: COLORS.success + '10' }]}>
                      <Icon name="cash" size={24} color={COLORS.success} />
                      <Text style={[styles.statCardValue, { color: COLORS.success }]}>
                        {formatCurrency(selectedCustomer.totalSpent)}
                      </Text>
                      <Text style={[styles.statCardLabel, { color: COLORS.textSecondary }]}>Total Spent</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: COLORS.blue + '10' }]}>
                      <Icon name="store" size={24} color={COLORS.blue} />
                      <Text style={[styles.statCardValue, { color: COLORS.blue }]}>{selectedCustomer.totalOrders ?? selectedCustomer.totalVisits}</Text>
                      <Text style={[styles.statCardLabel, { color: COLORS.textSecondary }]}>Visits</Text>
                    </View>
                  </View>

                  {/* Order History */}
                  <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Order History</Text>
                  {loadingOrders ? (
                    <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
                  ) : customerOrders.length > 0 ? (
                    customerOrders.map(order => (
                      <View key={order.id} style={[styles.orderCard, { backgroundColor: COLORS.background }]}>
                        <View style={styles.orderHeader}>
                          <Text style={[styles.orderNumber, { color: COLORS.textPrimary }]}>
                            #{order.orderNumber}
                          </Text>
                          <Text style={[styles.orderTotal, { color: COLORS.success }]}>
                            {formatCurrency(order.total)}
                          </Text>
                        </View>
                        <Text style={[styles.orderDate, { color: COLORS.textSecondary }]}>
                          {moment(order.createdAt).format('MMM D, YYYY h:mm A')}
                        </Text>
                        <View style={styles.orderItems}>
                          {order.items.slice(0, 3).map((item, idx) => (
                            <Text key={idx} style={[styles.orderItemText, { color: COLORS.textSecondary }]}>
                              {item.quantity}x {item.name}
                            </Text>
                          ))}
                          {order.items.length > 3 && (
                            <Text style={[styles.orderItemText, { color: COLORS.textSecondary }]}>
                              +{order.items.length - 3} more items
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyOrders}>
                      <Icon name="cart-off" size={48} color={COLORS.textSecondary} />
                      <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>No orders yet</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: COLORS.borderLight }]}>
        <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Customers</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: COLORS.primary }]}
          onPress={openAddCustomerModal}
        >
          <Icon name="plus" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: COLORS.cardBackground }]}>
        <Icon name="magnify" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: COLORS.textPrimary }]}
          placeholder="Search by name or phone..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchData()}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); fetchData(); }}>
            <Icon name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.cardBackground }]}>
            <Icon name="account-group" size={28} color={COLORS.primary} />
            <Text style={[styles.summaryValue, { color: COLORS.textPrimary }]}>{stats.totalCustomers}</Text>
            <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Total Customers</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.cardBackground }]}>
            <Icon name="account-plus" size={28} color={COLORS.success} />
            <Text style={[styles.summaryValue, { color: COLORS.textPrimary }]}>{stats.newThisMonth}</Text>
            <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>New This Month</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.cardBackground }]}>
            <Icon name="crown" size={28} color="#F59E0B" />
            <Text style={[styles.summaryValue, { color: COLORS.textPrimary }]}>{stats.tiers.gold + stats.tiers.platinum}</Text>
            <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Premium</Text>
          </View>
        </View>
      )}

      {/* Customer List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>Loading customers...</Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="account-off" size={64} color={COLORS.textSecondary} />
          <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No Customers Found</Text>
          <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
            {searchQuery ? 'Try a different search term' : 'Customers will appear here after they make purchases'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          renderItem={({ item }) => <CustomerCard item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      <CustomerDetailModal />

      {/* Add/Edit Customer Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View style={[styles.editModalContent, { backgroundColor: COLORS.cardBackground }]}>
              {/* Modal Header */}
              <View style={styles.editModalHeader}>
                <Text style={[styles.editModalTitle, { color: COLORS.textPrimary }]}>
                  {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                </Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Icon name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Name *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: COLORS.background,
                      color: COLORS.textPrimary,
                      borderColor: formErrors.name ? COLORS.error : COLORS.borderLight
                    }
                  ]}
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="Enter customer name"
                  placeholderTextColor={COLORS.textSecondary}
                />
                {formErrors.name && (
                  <Text style={[styles.formError, { color: COLORS.error }]}>{formErrors.name}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Phone *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: COLORS.background,
                      color: COLORS.textPrimary,
                      borderColor: formErrors.phone ? COLORS.error : COLORS.borderLight
                    }
                  ]}
                  value={formPhone}
                  onChangeText={setFormPhone}
                  placeholder="+962 7XX XXX XXX"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="phone-pad"
                />
                {formErrors.phone && (
                  <Text style={[styles.formError, { color: COLORS.error }]}>{formErrors.phone}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Email</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: COLORS.background, color: COLORS.textPrimary, borderColor: COLORS.borderLight }
                  ]}
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="customer@example.com"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: COLORS.primary }]}
                onPress={handleSaveCustomer}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Icon name={editingCustomer ? 'content-save' : 'plus'} size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>
                      {editingCustomer ? 'Save Changes' : 'Add Customer'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  phone: {
    fontSize: 13,
    marginTop: 2,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalKeyboardView: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  customerInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  largeAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  customerName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  section: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  orderCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 12,
    marginTop: 4,
  },
  orderItems: {
    marginTop: 8,
  },
  orderItemText: {
    fontSize: 13,
  },
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  // Add button styles
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Edit modal styles
  editModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  formError: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  editCustomerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
  },
  editCustomerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CustomersScreen;
