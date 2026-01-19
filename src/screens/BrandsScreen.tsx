import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { RootState } from '../store/store';
import { apiClient } from '../services/apiClient';
import ConfirmationModal from '../components/common/ConfirmationModal';
import CreateBrandModal from '../components/brands/CreateBrandModal';

interface Brand {
  id: string;
  name: string;
  establishmentLoginId: string;
  description?: string;
  logo?: string;
  establishmentsCount: number;
  totalSales?: number;
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const BrandsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const { establishments } = useSelector((state: RootState) => state.auth);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  // Form state
  
  
  

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      if (!refreshing) setIsLoading(true);
      const response = await apiClient.get('/api/brands');
      setBrands(response.data || []);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
      // Mock data
      setBrands([
        {
          id: '1',
          name: 'Coffee House',
          establishmentLoginId: 'coffee-house',
          description: 'Premium coffee chain',
          establishmentsCount: 3,
          totalSales: 45000,
          createdAt: new Date().toISOString(),
          status: 'ACTIVE',
        },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBrands();
  }, []);

  const confirmDelete = (brand: Brand) => {
    setDeleteTarget(brand);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/api/brands/${deleteTarget.id}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchBrands();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete brand');
    }
  };

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} JOD`;
  };

  const stats = {
    total: brands.length,
    active: brands.filter((b) => b.status === 'ACTIVE').length,
    totalEstablishments: brands.reduce((sum, b) => sum + b.establishmentsCount, 0),
  };

  const renderBrand = ({ item }: { item: Brand }) => (
    <TouchableOpacity
      style={[styles.brandCard, { backgroundColor: COLORS.cardBackground }]}
      onPress={() => navigation.navigate('BrandDashboard', { brandId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.brandHeader}>
        <View style={[styles.brandIcon, { backgroundColor: '#F3E8FF' }]}>
          <Icon name="tag-heart" size={28} color="#9333EA" />
        </View>
        <View style={styles.brandInfo}>
          <Text style={[styles.brandName, { color: COLORS.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.brandSlug, { color: COLORS.textSecondary }]}>@{item.establishmentLoginId}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'ACTIVE' ? '#E8F5E9' : '#F5F5F5' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: item.status === 'ACTIVE' ? '#2E7D32' : '#757575' },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.brandDesc, { color: COLORS.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.brandStats}>
        <View style={styles.brandStatItem}>
          <Icon name="store" size={16} color={COLORS.textSecondary} />
          <Text style={[styles.brandStatValue, { color: COLORS.textPrimary }]}>
            {item.establishmentsCount}
          </Text>
          <Text style={[styles.brandStatLabel, { color: COLORS.textSecondary }]}>Locations</Text>
        </View>
        {item.totalSales !== undefined && (
          <View style={styles.brandStatItem}>
            <Icon name="trending-up" size={16} color="#7CC39F" />
            <Text style={[styles.brandStatValue, { color: '#7CC39F' }]}>
              {formatCurrency(item.totalSales)}
            </Text>
            <Text style={[styles.brandStatLabel, { color: COLORS.textSecondary }]}>Total Sales</Text>
          </View>
        )}
      </View>

      <View style={styles.brandActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
          onPress={() => navigation.navigate('BrandDashboard', { brandId: item.id })}
        >
          <Icon name="chart-bar" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
          onPress={() => navigation.navigate('BrandLocations', { brandId: item.id })}
        >
          <Icon name="store-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
          onPress={() => Alert.alert('Coming Soon', 'Edit brand feature coming soon.')}
        >
          <Icon name="pencil" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
          onPress={() => confirmDelete(item)}
        >
          <Icon name="trash-can-outline" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitle}>
              <View style={styles.headerIconContainer}>
                <Icon name="tag-heart" size={28} color="#000" />
              </View>
              <View>
                <Text style={[styles.title, { color: COLORS.textPrimary }]}>Brands</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                  Manage brand portfolios
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
              <Icon name="plus" size={20} color="#000" />
              <Text style={styles.addButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
              <Icon name="tag-multiple" size={20} color="#9333EA" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Brands</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.total}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="check-circle" size={20} color="#2E7D32" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Active</Text>
            <Text style={[styles.statValue, { color: '#7CC39F' }]}>{stats.active}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="store" size={20} color="#1976D2" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Locations</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.totalEstablishments}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: '#E3F2FD' }]}>
          <Icon name="information-outline" size={20} color="#1976D2" />
          <Text style={styles.infoText}>
            Brands help you group multiple establishments under a single identity for consolidated reporting and management.
          </Text>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7CC39F" />
          </View>
        ) : brands.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Icon name="tag-off" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No brands yet</Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
              Create your first brand to group establishments together.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setShowCreateModal(true)}>
              <Text style={styles.emptyButtonText}>Create Brand</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={brands}
            keyExtractor={(item) => item.id}
            renderItem={renderBrand}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />
            }
          />
        )}


        {/* Create Brand Modal - Full wizard with establishment and employee selection */}
        <CreateBrandModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchBrands}
        />

        {/* Delete Confirmation */}
        <ConfirmationModal
          isVisible={showDeleteConfirm}
          title="Delete Brand"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? All linked establishments will be unlinked.`}
          confirmText="Delete"
          confirmColor="#DC2626"
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
          }}
        />
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
  headerContent: {
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7CC39F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
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
    fontSize: 20,
    fontWeight: '800',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1565C0',
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  brandCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
  },
  brandSlug: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  brandDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 12,
  },
  brandStats: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    gap: 24,
  },
  brandStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  brandStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  brandActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#7CC39F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  formInputMulti: {
    minHeight: 100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#7CC39F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
});

export default BrandsScreen;
