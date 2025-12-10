import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScreenContainer } from '../components/ScreenContainer';
import { itemsService, Item } from '../services/itemsService';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import moment from 'moment-timezone';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { fetchNotifications } from '../store/slices/notificationsSlice';

const InventoryScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const [activeTab, setActiveTab] = useState<'stock' | 'alerts'>('stock');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  
  // Get notifications from Redux state
  const { notifications, isLoading: notificationsLoading } = useSelector(
    (state: RootState) => state.notifications
  );
  
  // Filter stock alerts from notifications (exclude held orders and other non-stock notifications)
  const stockAlerts = useMemo(() => {
    const stockAlertTypes = ['STOCK_ALERT_YELLOW', 'STOCK_ALERT_RED', 'OUT_OF_STOCK'];
    return notifications.filter(
      (notification) => stockAlertTypes.includes(notification.type)
    );
  }, [notifications]);

  useEffect(() => {
    loadItems();
    // Fetch notifications to get stock alerts
    dispatch(fetchNotifications({ limit: 100 }));
  }, [dispatch]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await itemsService.getAll();
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (item: Item) => {
    if (!item.trackStock) return { label: 'Unlimited', color: COLORS.primary, bg: COLORS.successBg, icon: 'infinity' };
    const stock = item.availableStock || 0;
    if (stock === 0) return { label: 'Out of Stock', color: COLORS.error, bg: COLORS.errorBg, icon: 'alert-circle' };
    if (stock < 5) return { label: `Low: ${stock}`, color: COLORS.warning, bg: COLORS.warningBg, icon: 'alert' };
    return { label: `${stock} in stock`, color: COLORS.primary, bg: COLORS.successBg, icon: 'check-circle' };
  };

  const renderStockItem = ({ item }: { item: Item }) => {
    const stockStatus = getStockStatus(item);
    
    return (
      <View style={[styles.itemCard, { backgroundColor: COLORS.white }]}>
        <View style={styles.itemMainContent}>
          <View style={[styles.itemIconContainer, { backgroundColor: COLORS.containerGray }]}>
            <Icon 
              name="package-variant" 
              size={28} 
              color={COLORS.primary} 
            />
          </View>
          
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: COLORS.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.itemMetaRow}>
              <Text style={[styles.itemPrice, { color: COLORS.primary }]}>
                ${item.price.toFixed(2)}
              </Text>
              <View style={[styles.stockBadge, { backgroundColor: stockStatus.bg }]}>
                <Icon name={stockStatus.icon} size={12} color={stockStatus.color} />
                <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                  {stockStatus.label}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderAlertItem = ({ item }: { item: any }) => (
    <View style={[styles.alertCard, { backgroundColor: COLORS.white }]}>
      <View style={[styles.alertIconContainer, { backgroundColor: COLORS.errorBg }]}>
        <Icon name="alert-circle" size={28} color={COLORS.error} />
      </View>
      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <Text style={[styles.alertMessage, { color: COLORS.textPrimary }]} numberOfLines={2}>
            {item.message}
          </Text>
          <View style={[styles.alertPriorityBadge, { backgroundColor: COLORS.errorBg }]}>
            <Text style={[styles.alertPriorityText, { color: COLORS.errorText }]}>High</Text>
          </View>
        </View>
        <View style={styles.alertFooter}>
          <Icon name="clock-outline" size={14} color={COLORS.textTertiary} />
          <Text style={[styles.alertTime, { color: COLORS.textSecondary }]}>
            {moment(item.createdAt).tz('Asia/Amman').fromNow()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Inventory Command</Text>
            <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>
              {activeTab === 'stock' ? `${filteredItems.length} items` : `${stockAlerts.length} alerts`}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: COLORS.badgeBg }]}
            onPress={loadItems}
          >
            <Icon name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'stock' && styles.tabActive]}
            onPress={() => setActiveTab('stock')}
          >
            <View style={styles.tabContent}>
              <View style={styles.tabLeft}>
                <Icon 
                  name="package-variant" 
                  size={18} 
                  color={activeTab === 'stock' ? COLORS.primary : COLORS.textSecondary} 
                />
                <Text style={[styles.tabText, { color: activeTab === 'stock' ? COLORS.primary : COLORS.textSecondary }]}>
                  Stock List
                </Text>
              </View>
              <View style={[styles.tabBadge, { 
                backgroundColor: COLORS.primary 
              }]}>
                <Text style={[styles.tabBadgeText, { 
                  color: COLORS.white 
                }]}>
                  {filteredItems.length}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'alerts' && styles.tabActive]}
            onPress={() => setActiveTab('alerts')}
          >
            <View style={styles.tabContent}>
              <View style={styles.tabLeft}>
                <Icon 
                  name="bell-alert" 
                  size={18} 
                  color={activeTab === 'alerts' ? COLORS.primary : COLORS.textSecondary} 
                />
                <Text style={[styles.tabText, { color: activeTab === 'alerts' ? COLORS.primary : COLORS.textSecondary }]}>
                  Alerts
                </Text>
              </View>
              <View style={[styles.tabBadge, { 
                backgroundColor: COLORS.error
              }]}>
                <Text style={[styles.tabBadgeText, { 
                  color: COLORS.white
                }]}>
                  {stockAlerts.length}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'stock' && (
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: COLORS.textPrimary, backgroundColor: COLORS.surface }]}
            placeholder="Search items by name..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Icon name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {activeTab === 'alerts' && stockAlerts.length > 0 && (
        <View style={[styles.alertsSummary, { backgroundColor: COLORS.errorBg }]}>
          <Icon name="information" size={18} color={COLORS.errorText} />
          <Text style={[styles.alertsSummaryText, { color: COLORS.errorText }]}>
            {stockAlerts.length} item{stockAlerts.length > 1 ? 's' : ''} need{stockAlerts.length === 1 ? 's' : ''} attention
          </Text>
        </View>
      )}

      {loading && activeTab === 'stock' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>Loading inventory...</Text>
        </View>
      ) : activeTab === 'stock' ? (
        <FlatList
          data={filteredItems}
          renderItem={renderStockItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: COLORS.cardBg }]}>
                <Icon 
                  name="package-variant-closed" 
                  size={56} 
                  color={COLORS.textTertiary} 
                />
              </View>
              <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
                No items found
              </Text>
              <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                {searchQuery ? 'Try adjusting your search' : 'Add items to get started'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={stockAlerts}
          renderItem={renderAlertItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: COLORS.cardBg }]}>
                <Icon 
                  name="bell-check" 
                  size={56} 
                  color={COLORS.textTertiary} 
                />
              </View>
              <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
                All clear!
              </Text>
              <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                No stock alerts at the moment
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 16,
    marginHorizontal: 20,
    marginTop: 10, // Reduced since SafeAreaView now handles the top spacing
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.containerGray,
  },
  tabActive: {
    backgroundColor: colors.badgeBg,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  tabBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 32,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    paddingVertical: 14,
    paddingLeft: 44,
    paddingRight: 44,
    borderRadius: 16,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    backgroundColor: colors.white,
  },
  clearButton: {
    position: 'absolute',
    right: 32,
    top: 14,
    zIndex: 1,
  },
  alertsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  alertsSummaryText: {
    fontSize: 13,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  alertCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  alertPriorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexShrink: 0,
  },
  alertPriorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.containerGray,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default InventoryScreen;
