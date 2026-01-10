import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScreenContainer } from '../components/ScreenContainer';
import { itemsService, Item, CreateItemDto, UpdateItemDto } from '../services/itemsService';
import ItemFormModal from '../components/inventory/ItemFormModal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import moment from 'moment-timezone';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { fetchNotifications } from '../store/slices/notificationsSlice';
import { apiClient } from '../services/apiClient';
import { getImageUrl } from '../config/api.config';

// Category interface
interface Category {
  id: string;
  name: string;
}

type SortOption = 'name' | 'price' | 'stock';

const InventoryScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const [activeTab, setActiveTab] = useState<'stock' | 'alerts'>('stock');
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'item' | 'addon'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Item Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

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

  // Calculate counts for items and addons
  const itemCounts = useMemo(() => {
    const itemsCount = items.filter(i => (i.type || 'ITEM').toUpperCase() === 'ITEM').length;
    const addonsCount = items.filter(i => (i.type || 'ITEM').toUpperCase() === 'ADDON').length;
    return {
      all: items.length,
      item: itemsCount,
      addon: addonsCount,
    };
  }, [items]);

  // Stock summary calculations
  const stockSummary = useMemo(() => {
    const tracked = items.filter(item => item.trackStock);

    const outOfStock = tracked.filter(item => (item.availableStock || 0) <= 0);

    const lowStock = tracked.filter(item => {
      const stock = item.availableStock || 0;
      const threshold = item.lowStockThresholdYellow || 5;
      return stock > 0 && stock <= threshold;
    });

    const healthyStock = tracked.filter(item => {
      const stock = item.availableStock || 0;
      const threshold = item.lowStockThresholdYellow || 5;
      return stock > threshold;
    });

    return {
      total: items.length,
      tracked: tracked.length,
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      healthy: healthyStock.length,
      unlimited: items.length - tracked.length,
    };
  }, [items]);

  // Calculate Inventory Valuation
  const valuation = useMemo(() => {
    let retail = 0;
    let cost = 0;
    items.forEach(item => {
      // Only value items that track stock and have positive stock
      if (item.trackStock && (item.availableStock || 0) > 0) {
        const qty = item.availableStock || 0;
        retail += qty * item.price;
        cost += qty * (item.costPrice || 0);
      }
    });
    return { retail, cost, potentialProfit: retail - cost };
  }, [items]);

  useEffect(() => {
    loadItems();
    loadCategories();
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

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/api/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setShowItemModal(true);
  };

  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleSaveItem = async (data: CreateItemDto | UpdateItemDto) => {
    try {
      if (selectedItem) {
        await itemsService.update(selectedItem.id, data as UpdateItemDto);
      } else {
        await itemsService.create(data as CreateItemDto);
      }
      await loadItems();
    } catch (error) {
      console.error('Failed to save item:', error);
      throw error; // Propagate to modal for alert
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await itemsService.delete(itemId);
      await loadItems();
      setShowItemModal(false);
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  };

  const getCategoryName = useCallback((categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  }, [categories]);

  // Filter and sort items with priority for important items
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => {
        const type = (item.type || 'ITEM').toUpperCase();
        return filterType === 'item' ? type === 'ITEM' : type === 'ADDON';
      });
    }

    // Apply sorting with priority for important items
    switch (sortBy) {
      case 'price':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'stock':
        filtered = [...filtered].sort((a, b) => {
          const stockA = a.trackStock ? (a.availableStock || 0) : Infinity;
          const stockB = b.trackStock ? (b.availableStock || 0) : Infinity;
          return stockA - stockB; // Low stock first
        });
        break;
      case 'name':
      default:
        // Sort by name but prioritize important items (out of stock and low stock first)
        filtered = [...filtered].sort((a, b) => {
          const getItemPriority = (item: Item) => {
            if (!item.trackStock) return 3; // Unlimited stock items last
            const stock = item.availableStock || 0;
            const threshold = item.lowStockThresholdYellow || 5;
            
            if (stock <= 0) return 0; // Out of stock first
            if (stock <= threshold) return 1; // Low stock second
            return 2; // Normal stock third
          };
          
          const priorityA = getItemPriority(a);
          const priorityB = getItemPriority(b);
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB; // Sort by priority first
          }
          
          return a.name.localeCompare(b.name); // Then by name
        });
        break;
    }

    return filtered;
  }, [items, searchQuery, sortBy, filterType]);

  const getStockStatus = (item: Item) => {
    if (!item.trackStock) return { label: 'Unlimited', color: COLORS.primary, bg: COLORS.successBg, icon: 'infinity' };

    const stock = item.availableStock || 0;
    const lowThreshold = item.lowStockThresholdYellow || 5;

    if (stock <= 0) {
      const label = stock === 0 ? 'Out of Stock' : `Oversold: ${stock}`;
      return { label, color: COLORS.error, bg: COLORS.errorBg, icon: 'alert-circle' };
    }

    if (stock <= lowThreshold) return { label: `Low: ${stock}`, color: COLORS.warning, bg: COLORS.warningBg, icon: 'alert' };

    return { label: `${stock} in stock`, color: COLORS.primary, bg: COLORS.successBg, icon: 'check-circle' };
  };

  const getItemType = (item: Item): 'item' | 'addon' => {
    // Use the real type from API - map ITEM/ADDON to lowercase for display
    if (item.type) {
      return item.type.toLowerCase() as 'item' | 'addon';
    }
    // Default to 'item' if type is not set
    return 'item';
  };

  const renderStockItem = ({ item }: { item: Item }) => {
    const stockStatus = getStockStatus(item);
    const itemType = getItemType(item);
    const categoryName = getCategoryName(item.categoryId);
    
    // Determine if this is an important item (out of stock or low stock)
    const isImportant = item.trackStock && (item.availableStock || 0) <= (item.lowStockThresholdYellow || 5);
    const isOutOfStock = item.trackStock && (item.availableStock || 0) <= 0;

    return (
      <TouchableOpacity
        style={[
          styles.gridItemCard, 
          { backgroundColor: COLORS.white },
          isImportant && styles.gridItemCardImportant,
          isOutOfStock && styles.gridItemCardCritical
        ]}
        onPress={() => handleEditItem(item)}
      >
        <View style={[styles.gridItemImageContainer, { backgroundColor: COLORS.containerGray }]}>
          {item.image ? (
            <Image 
              source={{ uri: getImageUrl(item.image) }} 
              style={[styles.gridItemImage, isOutOfStock && styles.gridItemImageDimmed]}
              resizeMode="cover"
            />
          ) : (
            <Icon
              name="package-variant"
              size={40}
              color={isOutOfStock ? COLORS.textTertiary : COLORS.primary}
            />
          )}
          
          <View style={[styles.gridTypeBadge, {
            backgroundColor: itemType === 'addon' ? COLORS.warningBg : 'rgba(0,0,0,0.6)'
          }]}>
            <Text style={[styles.gridTypeBadgeText, {
              color: itemType === 'addon' ? COLORS.warning : '#FFF'
            }]}>
              {itemType === 'addon' ? 'Add-on' : 'Item'}
            </Text>
          </View>

          {/* Priority indicator for important items */}
          {isImportant && (
            <View style={[styles.gridPriorityIndicator, {
              backgroundColor: isOutOfStock ? COLORS.error : COLORS.warning
            }]}>
              <Icon 
                name={isOutOfStock ? "alert-circle" : "alert"} 
                size={12} 
                color="#FFF" 
              />
            </View>
          )}
        </View>

        <View style={styles.gridItemContent}>
          <Text style={[styles.gridItemName, { color: COLORS.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          
          <Text style={[styles.gridItemCategory, { color: COLORS.textSecondary }]} numberOfLines={1}>
            {categoryName}
          </Text>

          <View style={styles.gridItemFooter}>
            <Text style={[styles.gridItemPrice, { color: COLORS.primary }]}>
              {item.price.toFixed(2)} JOD
            </Text>

            {item.trackStock && (
              <View style={[styles.gridStockBadge, { backgroundColor: stockStatus.bg }]}>
                <Text style={[styles.gridStockText, { color: stockStatus.color }]}>
                  {item.availableStock}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
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
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: COLORS.primary }]}
            onPress={handleAddItem}
          >
            <Icon name="plus" size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Compact Stock Summary */}
        <View style={styles.compactSummaryRow}>
          <View style={styles.compactSummaryLeft}>
            <View style={[styles.compactStockItem, { backgroundColor: COLORS.errorBg }]}>
              <Icon name="alert-circle" size={16} color={COLORS.error} />
              <Text style={[styles.compactStockValue, { color: COLORS.error }]}>{stockSummary.outOfStock}</Text>
              <Text style={[styles.compactStockLabel, { color: COLORS.textSecondary }]}>Out</Text>
            </View>
            <View style={[styles.compactStockItem, { backgroundColor: COLORS.warningBg }]}>
              <Icon name="alert" size={16} color={COLORS.warning} />
              <Text style={[styles.compactStockValue, { color: COLORS.warning }]}>{stockSummary.lowStock}</Text>
              <Text style={[styles.compactStockLabel, { color: COLORS.textSecondary }]}>Low</Text>
            </View>
            <View style={[styles.compactStockItem, { backgroundColor: COLORS.successBg }]}>
              <Icon name="check-circle" size={16} color={COLORS.primary} />
              <Text style={[styles.compactStockValue, { color: COLORS.primary }]}>{stockSummary.healthy}</Text>
              <Text style={[styles.compactStockLabel, { color: COLORS.textSecondary }]}>Good</Text>
            </View>
          </View>
          <View style={styles.compactValuation}>
            <Text style={[styles.compactValuationValue, { color: COLORS.textPrimary }]}>
              {valuation.retail.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD
            </Text>
            <Text style={[styles.compactValuationLabel, { color: COLORS.textSecondary }]}>Total Value</Text>
          </View>
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

      {/* Filter Type Chips */}
      {activeTab === 'stock' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {[
            { key: 'all' as const, label: 'All', count: itemCounts.all },
            { key: 'item' as const, label: 'Items', count: itemCounts.item },
            { key: 'addon' as const, label: 'Add-ons', count: itemCounts.addon },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filterType === option.key ? COLORS.primary : COLORS.white,
                  borderColor: filterType === option.key ? COLORS.primary : COLORS.border,
                }
              ]}
              onPress={() => setFilterType(option.key)}
            >
              <Text style={[
                styles.filterChipText,
                { color: filterType === option.key ? '#FFF' : COLORS.textSecondary }
              ]}>
                {option.label} ({option.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Sort Controls */}
      {activeTab === 'stock' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortContainer}
          contentContainerStyle={styles.sortContent}
        >
          <Text style={[styles.sortLabel, { color: COLORS.textSecondary }]}>Sort by:</Text>
          {[
            { key: 'name' as SortOption, label: 'Priority', icon: 'sort-alphabetical-ascending' },
            { key: 'price' as SortOption, label: 'Price', icon: 'cash-multiple' },
            { key: 'stock' as SortOption, label: 'Stock', icon: 'package-variant' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortChip,
                {
                  backgroundColor: sortBy === option.key ? COLORS.primary : COLORS.surface,
                  borderColor: sortBy === option.key ? COLORS.primary : COLORS.border,
                }
              ]}
              onPress={() => setSortBy(option.key)}
            >
              <Icon
                name={option.icon}
                size={14}
                color={sortBy === option.key ? '#FFF' : COLORS.textSecondary}
              />
              <Text style={[
                styles.sortChipText,
                { color: sortBy === option.key ? '#FFF' : COLORS.textSecondary }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>Loading Inventory...</Text>
        </View>
      ) : activeTab === 'stock' ? (
        <FlatList
          data={filteredItems}
          renderItem={renderStockItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridContent}
          numColumns={2}
          columnWrapperStyle={styles.gridColumnWrapper}
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
                No Items Found
              </Text>
              <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                {searchQuery ? 'Try Adjusting Your Search' : 'Add Items To Get Started'}
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
                All Clear!
              </Text>
              <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                No Stock Alerts At The Moment
              </Text>
            </View>
          }
        />
      )}

      <ItemFormModal
        visible={showItemModal}
        onClose={() => setShowItemModal(false)}
        onSubmit={handleSaveItem}
        onDelete={handleDeleteItem}
        initialData={selectedItem}
        categories={categories}
      />
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  header: {
    padding: 16, // Reduced from 20
    paddingBottom: 12, // Reduced from 16
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 16, // Reduced from 20
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
    marginBottom: 12, // Reduced from 16
  },
  compactSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactSummaryLeft: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  compactStockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
  },
  compactStockValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  compactStockLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  compactValuation: {
    alignItems: 'flex-end',
  },
  compactValuationValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  compactValuationLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
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
  addButton: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
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
  filterContainer: {
    marginBottom: 12,
    flexGrow: 0,
    minHeight: 40,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 2, // Add some vertical padding for shadows
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sortContainer: {
    marginBottom: 12,
    flexGrow: 0,
    minHeight: 40,
  },
  sortContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 36,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Grid Styles
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  gridColumnWrapper: {
    justifyContent: 'space-between',
    gap: 12, // Gap between columns
  },
  gridItemCard: {
    width: '48%', // Approx half with gap
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9', // Light border
  },
  gridItemCardImportant: {
    borderColor: colors.warning,
    borderWidth: 2,
    shadowColor: colors.warning,
    shadowOpacity: 0.15,
  },
  gridItemCardCritical: {
    borderColor: colors.error,
    borderWidth: 2,
    shadowColor: colors.error,
    shadowOpacity: 0.2,
  },
  gridItemImageContainer: {
    height: 120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
  },
  gridItemImageDimmed: {
    opacity: 0.6,
  },
  gridTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gridTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gridPriorityIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemContent: {
    padding: 12,
  },
  gridItemName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridItemCategory: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  gridItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridItemPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  gridStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridStockText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // End Grid Styles

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
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexShrink: 0,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
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
