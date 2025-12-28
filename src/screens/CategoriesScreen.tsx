import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScreenContainer } from '../components/ScreenContainer';
import { categoriesService, Category, CreateCategoryDto, UpdateCategoryDto } from '../services/categoriesService';
import CategoryFormModal from '../components/inventory/CategoryFormModal';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const CategoriesScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoriesService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowModal(true);
  };

  const handleSubmit = async (data: CreateCategoryDto | UpdateCategoryDto) => {
    try {
      if (selectedCategory) {
        await categoriesService.update(selectedCategory.id, data as UpdateCategoryDto);
      } else {
        await categoriesService.create(data as CreateCategoryDto);
      }
      loadCategories();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoriesService.delete(id);
      loadCategories();
    } catch (error) {
      throw error;
    }
  };

  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Icon 
            name={item.icon || 'folder-outline'} 
            size={24} 
            color={COLORS.primary} 
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.sortOrder}>Sort Order: {item.sortOrder}</Text>
        </View>
        <View style={styles.statusContainer}>
          {!item.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveText}>Inactive</Text>
            </View>
          )}
          <Icon name="chevron-right" size={20} color={COLORS.textTertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Categories</Text>
          <Text style={styles.headerSubtitle}>{categories.length} Categories</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="folder-outline" size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No categories found</Text>
              <Text style={styles.emptySubtext}>Add a category to organize your menu</Text>
            </View>
          }
        />
      )}

      <CategoryFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        initialData={selectedCategory}
      />
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '15', // 15% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sortOrder: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.textTertiary + '20',
    borderRadius: 6,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});

export default CategoriesScreen;
