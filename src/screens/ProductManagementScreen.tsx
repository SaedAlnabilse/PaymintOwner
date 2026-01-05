import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import { ScreenContainer } from '../components/ScreenContainer';
import { itemsService, Item, CreateItemDto, UpdateItemDto } from '../services/itemsService';
import { categoriesService, Category } from '../services/categoriesService';
import ItemFormModal from '../components/inventory/ItemFormModal';
import CategoryFormModal from '../components/inventory/CategoryFormModal';
import { getImageUrl } from '../config/api.config';


const ProductManagementScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  // Remove currency hook call since it might not be available yet or failing
  // Instead use a hardcoded fallback or get it from another source if possible
  const currencySymbol = 'JOD'; // Fallback

  // State
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Edit State
  const [categoryEditMode, setCategoryEditMode] = useState(false);

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const loadData = async () => {
    try {
      const [itemsData, categoriesData] = await Promise.all([
        itemsService.getAll(),
        categoriesService.getAll()
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --- Filtering Logic ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategoryId]);

  // --- Stats Logic ---
  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter(i => i.trackStock && (i.availableStock || 0) <= (i.lowStockThresholdYellow || 5)).length;
    const outOfStock = items.filter(i => i.trackStock && (i.availableStock || 0) <= 0).length;
    return { totalItems, lowStock, outOfStock };
  }, [items]);

  // --- Item Handlers ---
  const handleSaveItem = async (data: any) => {
    if (selectedItem) {
      await itemsService.update(selectedItem.id, data);
    } else {
      await itemsService.create(data);
    }
    await loadData();
  };

  const handleDeleteItem = async (id: string) => {
    await itemsService.delete(id);
    await loadData();
    setShowItemModal(false);
  };

  // --- Category Handlers ---
  const handleSaveCategory = async (name: string, icon: string, color: string) => {
    if (selectedCategory) {
      await categoriesService.update(selectedCategory.id, { name, icon, color });
    } else {
      await categoriesService.create({ name, icon, color });
    }
    await loadData();
  };

  const handleDeleteCategory = async (id: string) => {
    await categoriesService.delete(id);
    if (selectedCategoryId === id) setSelectedCategoryId('all');
    await loadData();
    setShowCategoryModal(false);
  };

  // --- Renderers ---

  const renderCategoryPill = (category: Category | 'all') => {
    const isAll = category === 'all';
    const id = isAll ? 'all' : category.id;
    const isSelected = selectedCategoryId === id;

    // In edit mode, 'All' is not editable
    if (categoryEditMode && isAll) return null;

    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.categoryPill,
          isSelected && !categoryEditMode && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
          categoryEditMode && styles.categoryPillEdit,
          categoryEditMode && isSelected && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' }
        ]}
        onPress={() => {
          if (categoryEditMode && !isAll) {
            setSelectedCategory(category);
            setShowCategoryModal(true);
          } else {
            setSelectedCategoryId(id);
          }
        }}
        activeOpacity={0.7}
      >
        {categoryEditMode && !isAll && (
          <View style={styles.editBadge}>
            <Icon name="pencil" size={10} color="#FFF" />
          </View>
        )}

        {!isAll && category.icon && (
          <Icon
            name={category.icon}
            size={16}
            color={isSelected && !categoryEditMode ? '#FFF' : (category.color || COLORS.textSecondary)}
            style={{ marginRight: 6 }}
          />
        )}

        <Text style={[
          styles.categoryPillText,
          isSelected && !categoryEditMode && { color: '#FFF' },
          categoryEditMode && { color: COLORS.textPrimary }
        ]}>
          {isAll ? 'All Items' : category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItemCard = ({ item }: { item: Item }) => {
    const stockStatus = getStockStatus(item);

    return (
      <TouchableOpacity
        style={[styles.itemCard, viewMode === 'list' && styles.itemCardList]}
        onPress={() => {
          setSelectedItem(item);
          setShowItemModal(true);
        }}
      >
        <View style={[styles.imageContainer, viewMode === 'list' && styles.imageContainerList]}>
          {item.image ? (
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: COLORS.background }]}>
              <Icon name="package-variant" size={24} color={COLORS.textTertiary} />
            </View>
          )}
          {item.trackStock && (
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.bg }]}>
              <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                {item.availableStock}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.itemContent}>
          <View>
            <Text style={[styles.itemName, { color: COLORS.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.itemCategory, { color: COLORS.textSecondary }]} numberOfLines={1}>
              {categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized'}
            </Text>
          </View>
          <Text style={[styles.itemPrice, { color: COLORS.primary }]}>
            {item.price.toFixed(2)} {currencySymbol}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getStockStatus = (item: Item) => {
    if (!item.trackStock) return { bg: COLORS.successBg, color: COLORS.primary };
    const stock = item.availableStock || 0;
    const threshold = item.lowStockThresholdYellow || 5;
    if (stock <= 0) return { bg: COLORS.errorBg, color: COLORS.error };
    if (stock <= threshold) return { bg: COLORS.warningBg, color: COLORS.warning };
    return { bg: COLORS.successBg, color: COLORS.primary };
  };

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTagline}>INVENTORY MANAGEMENT</Text>
            <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Product Catalog</Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: COLORS.primary }]}
            onPress={() => {
              setSelectedItem(null);
              setShowItemModal(true);
            }}
          >
            <Icon name="plus" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Collapsible Stats Bar */}
        <Animated.View style={[styles.statsContainer, {
          opacity: headerHeight, height: headerHeight.interpolate({
            inputRange: [0, 1], outputRange: [0, 60] // Increased height for card spacing
          })
        }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.totalItems}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.lowStock}</Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Low Stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.error }]}>
              {stats.outOfStock}
            </Text>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Out of Stock</Text>
          </View>
        </Animated.View>
      </View>

      {/* Search & Categories Bar */}
      <View style={[styles.controlsContainer, { backgroundColor: COLORS.background }]}>
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight }]}>
            <Icon name="magnify" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: COLORS.textPrimary }]}
              placeholder="Search products..."
              placeholderTextColor={COLORS.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: COLORS.white, borderColor: COLORS.borderLight }]}
            onPress={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
          >
            <Icon name={viewMode === 'grid' ? 'view-list' : 'view-grid'} size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {renderCategoryPill('all')}
            {categories.map(c => renderCategoryPill(c))}

            {categoryEditMode && (
              <TouchableOpacity
                style={[styles.categoryPill, styles.addCategoryPill, { borderColor: COLORS.primary, borderStyle: 'dashed' }]}
                onPress={() => {
                  setSelectedCategory(null);
                  setShowCategoryModal(true);
                }}
              >
                <Icon name="plus" size={16} color={COLORS.primary} />
                <Text style={[styles.categoryPillText, { color: COLORS.primary }]}>New</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.editCatsButton, categoryEditMode && { backgroundColor: COLORS.primary }]}
            onPress={() => setCategoryEditMode(!categoryEditMode)}
          >
            <Icon
              name={categoryEditMode ? "check" : "pencil"}
              size={18}
              color={categoryEditMode ? "#FFF" : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          key={viewMode} // Force re-render on view change
          numColumns={viewMode === 'grid' ? 2 : 1}
          renderItem={renderItemCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="package-variant-closed" size={64} color={COLORS.textTertiary} />
              <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>No products found</Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      <ItemFormModal
        visible={showItemModal}
        onClose={() => setShowItemModal(false)}
        onSubmit={handleSaveItem}
        onDelete={handleDeleteItem}
        initialData={selectedItem}
        categories={categories}
      />

      <CategoryFormModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={handleSaveCategory}
        onDelete={handleDeleteCategory}
        initialData={selectedCategory}
      />
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
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
    marginBottom: 8,
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
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    overflow: 'hidden',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 24, backgroundColor: colors.borderLight },
  controlsContainer: {
    paddingVertical: 12,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
  },
  categoriesScroll: {
    paddingRight: 12,
    gap: 8,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  categoryPillEdit: {
    paddingRight: 12,
    paddingLeft: 12,
  },
  addCategoryPill: {
    backgroundColor: 'transparent',
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  editBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.textSecondary,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  editCatsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    marginLeft: 4,
    backgroundColor: colors.containerGray,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },
  itemCard: {
    flex: 1,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemCardList: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  imageContainerList: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  itemContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductManagementScreen;
