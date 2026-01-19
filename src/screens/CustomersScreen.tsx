import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
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
  shareCustomersReport,
  Customer,
  CustomerStats,
  CustomerOrder,
} from '../services/customers';
import moment from 'moment-timezone';
import CustomerFormModal from '../components/customers/CustomerFormModal';

const CustomersScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

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

  // Points adjustment state
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsAmount, setPointsAmount] = useState('');
  const [pointsOperation, setPointsOperation] = useState<'add' | 'deduct'>('add');
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);

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

  // Export Customers
  const handleExport = async () => {
    // If we have filters/search, we might want to fetch ALL matching customers for export?
    // For now, let's just export what's loaded or fetch a larger batch.
    // Let's fetch the first 1000 customers for export to be safe.
    try {
      setLoading(true);
      const allData = await getCustomers(1, 1000, searchQuery || undefined);
      await shareCustomersReport(allData.customers);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
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

  // Save customer
  const handleSaveCustomer = async (data: any) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
        Alert.alert('Success', 'Customer updated successfully');
      } else {
        await createCustomer(data);
        Alert.alert('Success', 'Customer added successfully');
      }
      // setEditModalVisible(false); // Modal handles closing
      fetchData(true);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save customer');
      throw error; // Let modal handle loading state if needed
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

  // Handle points adjustment
  const handlePointsAdjustment = async () => {
    if (!selectedCustomer || !pointsAmount) return;

    const amount = parseInt(pointsAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid points amount');
      return;
    }

    const finalAmount = pointsOperation === 'add' ? amount : -amount;

    // Check if deducting would go negative
    if (pointsOperation === 'deduct' && amount > selectedCustomer.points) {
      Alert.alert('Error', `Customer only has ${selectedCustomer.points} points available`);
      return;
    }

    setIsAdjustingPoints(true);
    try {
      const updatedCustomer = await updateCustomerPoints(selectedCustomer.id, finalAmount);
      setSelectedCustomer(updatedCustomer);
      Alert.alert(
        'Success',
        `${pointsOperation === 'add' ? 'Added' : 'Deducted'} ${amount} points ${pointsOperation === 'add' ? 'to' : 'from'} ${selectedCustomer.name}`
      );
      setShowPointsModal(false);
      setPointsAmount('');
      setPointsOperation('add');
      fetchData(true); // Refresh the list
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to adjust points');
    } finally {
      setIsAdjustingPoints(false);
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



        <View style={[styles.modalContent, { backgroundColor: COLORS.cardBackground }]}>

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



          <ScrollView

            style={styles.scrollView}

            contentContainerStyle={styles.scrollContent}

            showsVerticalScrollIndicator={true}

            bounces={true}

          >

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

                    <Text style={[styles.statCardLabel, { color: COLORS.textSecondary }]}>Spent</Text>

                  </View>

                  <View style={[styles.statCard, { backgroundColor: COLORS.blue + '10' }]}>

                    <Icon name="store" size={24} color={COLORS.blue} />

                    <Text style={[styles.statCardValue, { color: COLORS.blue }]}>{selectedCustomer.totalOrders ?? selectedCustomer.totalVisits}</Text>

                    <Text style={[styles.statCardLabel, { color: COLORS.textSecondary }]}>Visits</Text>

                  </View>

                </View>

                {/* Points Adjustment Button */}
                <TouchableOpacity
                  style={[styles.adjustPointsButton, { backgroundColor: COLORS.primary + '15' }]}
                  onPress={() => setShowPointsModal(true)}
                >
                  <Icon name="star-plus" size={20} color={COLORS.primary} />
                  <Text style={[styles.adjustPointsButtonText, { color: COLORS.primary }]}>Adjust Points</Text>
                </TouchableOpacity>


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

      </View>

    </Modal>

  );





  return (

    <ScreenContainer>

      {/* Header */}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTagline}>RELATIONSHIP MANAGEMENT</Text>
            <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Customers</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.containerGray }]}
              onPress={handleExport}
            >
              <Icon name="download" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: COLORS.primary }]}
              onPress={openAddCustomerModal}
            >
              <Icon name="plus" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Bar */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.headerStatValue, { color: COLORS.textPrimary }]}>{stats.totalCustomers}</Text>
              <Text style={[styles.headerStatLabel, { color: COLORS.textSecondary }]}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.headerStatValue, { color: COLORS.success }]}>{stats.newThisMonth}</Text>
              <Text style={[styles.headerStatLabel, { color: COLORS.textSecondary }]}>New</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.headerStatValue, { color: '#F59E0B' }]}>
                {stats.tiers.gold + stats.tiers.platinum}
              </Text>
              <Text style={[styles.headerStatLabel, { color: COLORS.textSecondary }]}>Premium</Text>
            </View>
          </View>
        )}
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

      {/* Points Adjustment Modal */}
      <Modal
        visible={showPointsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPointsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowPointsModal(false)} />
          <View style={[styles.pointsModalContent, { backgroundColor: COLORS.cardBackground }]}>
            <View style={styles.pointsModalHeader}>
              <Icon name="star-circle" size={40} color={COLORS.primary} />
              <Text style={[styles.pointsModalTitle, { color: COLORS.textPrimary }]}>
                Adjust Loyalty Points
              </Text>
              <Text style={[styles.pointsModalSubtitle, { color: COLORS.textSecondary }]}>
                {selectedCustomer?.name} • Current: {selectedCustomer?.points || 0} points
              </Text>
            </View>

            <View style={styles.pointsOperationContainer}>
              <TouchableOpacity
                style={[
                  styles.pointsOperationButton,
                  pointsOperation === 'add' && { backgroundColor: COLORS.successBg, borderColor: COLORS.primary },
                  { borderColor: COLORS.border }
                ]}
                onPress={() => setPointsOperation('add')}
              >
                <Icon name="plus-circle" size={24} color={pointsOperation === 'add' ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[
                  styles.pointsOperationText,
                  { color: pointsOperation === 'add' ? COLORS.primary : COLORS.textSecondary }
                ]}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pointsOperationButton,
                  pointsOperation === 'deduct' && { backgroundColor: COLORS.errorBg, borderColor: COLORS.error },
                  { borderColor: COLORS.border }
                ]}
                onPress={() => setPointsOperation('deduct')}
              >
                <Icon name="minus-circle" size={24} color={pointsOperation === 'deduct' ? COLORS.error : COLORS.textSecondary} />
                <Text style={[
                  styles.pointsOperationText,
                  { color: pointsOperation === 'deduct' ? COLORS.error : COLORS.textSecondary }
                ]}>Deduct</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.pointsInput, { backgroundColor: COLORS.background, borderColor: COLORS.border, color: COLORS.textPrimary }]}
              placeholder="Enter points amount"
              placeholderTextColor={COLORS.textTertiary}
              value={pointsAmount}
              onChangeText={setPointsAmount}
              keyboardType="number-pad"
            />

            <View style={styles.pointsModalActions}>
              <TouchableOpacity
                style={[styles.pointsCancelButton, { backgroundColor: COLORS.background }]}
                onPress={() => {
                  setShowPointsModal(false);
                  setPointsAmount('');
                  setPointsOperation('add');
                }}
              >
                <Text style={[styles.pointsCancelText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pointsConfirmButton,
                  { backgroundColor: pointsOperation === 'add' ? COLORS.primary : COLORS.error },
                  (!pointsAmount || isAdjustingPoints) && { opacity: 0.5 }
                ]}
                onPress={handlePointsAdjustment}
                disabled={!pointsAmount || isAdjustingPoints}
              >
                {isAdjustingPoints ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.pointsConfirmText}>
                    {pointsOperation === 'add' ? 'Add Points' : 'Deduct Points'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomerFormModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleSaveCustomer}
        initialData={editingCustomer}
      />

    </ScreenContainer>
  );
};



const createStyles = (colors: any) => StyleSheet.create({

  header: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addButtonText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: { alignItems: 'center' },
  headerStatValue: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  headerStatLabel: { fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statDivider: { width: 1, height: 24, backgroundColor: colors.borderLight, },

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

    padding: 20, // Add padding to prevent edge touching

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

    width: '100%',

    borderRadius: 20,

    padding: 24,

    maxHeight: '100%',

    flexShrink: 1,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 10 },

    shadowOpacity: 0.25,

    shadowRadius: 20,

    elevation: 10,

    overflow: 'hidden',

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

    fontSize: 22,

    fontWeight: '800',

  },

  scrollView: {

    // flex: 1 removed to allow self-sizing

  },



  scrollContent: {

    paddingBottom: 20,

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



  // Edit modal styles

  editModalHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 24,

  },

  editModalTitle: {

    fontSize: 22,

    fontWeight: '800',

  },

  formGroup: {

    marginBottom: 16,

  },

  formLabel: {

    fontSize: 14,

    fontWeight: '600',

    marginBottom: 8,

  },

  formInput: {

    borderWidth: 1,

    borderRadius: 10,

    padding: 14,

    fontSize: 15,

  },

  formError: {

    fontSize: 12,

    marginTop: 4,

  },

  modalActions: {

    flexDirection: 'row',

    gap: 12,

    marginTop: 20,

    paddingTop: 16,

    borderTopWidth: 1,

    borderTopColor: '#E2E8F0',

  },

  cancelBtn: {

    flex: 1,

    padding: 14,

    borderRadius: 10,

    borderWidth: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  cancelBtnText: {

    fontSize: 15,

    fontWeight: '600',

  },

  saveBtn: {

    flex: 1,

    padding: 14,

    borderRadius: 10,

    alignItems: 'center',

    justifyContent: 'center',

  },

  saveBtnText: {

    color: '#FFF',

    fontSize: 15,

    fontWeight: '700',

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

  // Points adjustment button styles
  adjustPointsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  adjustPointsButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Points Modal styles
  pointsModalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  pointsModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pointsModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
  },
  pointsModalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  pointsOperationContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pointsOperationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  pointsOperationText: {
    fontSize: 15,
    fontWeight: '700',
  },
  pointsInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  pointsModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  pointsCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  pointsCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  pointsConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  pointsConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default CustomersScreen;
