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
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { salesSettingsService } from '../services/salesSettings';
import DiscountModal from '../components/settings/DiscountModal';
import ConfirmationModal from '../components/common/ConfirmationModal';

import { Discount } from '../types/salesManagement';

const DiscountsScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      if (!refreshing) setIsLoading(true);
      const data = await salesSettingsService.getDiscounts();
      setDiscounts(data || []);
    } catch (err) {
      console.error('Failed to fetch discounts:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiscounts();
  }, []);

  const openCreateModal = () => {
    setEditingDiscount(null);
    setShowModal(true);
  };

  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setShowModal(true);
  };

  const handleSubmit = async (name: string, percentage: number, adminOnly: boolean, id?: string) => {
    try {
      setIsSubmitting(true);
      if (id) {
        await salesSettingsService.updateDiscount(id, name, percentage, adminOnly);
      } else {
        await salesSettingsService.addDiscount(name, percentage, adminOnly);
      }
      setShowModal(false);
      fetchDiscounts();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (discount: Discount) => {
    setDeleteTarget(discount);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await salesSettingsService.deleteDiscount(deleteTarget.id);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchDiscounts();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete discount');
    }
  };

  const toggleAdminOnly = async (discount: Discount) => {
    try {
      await salesSettingsService.updateDiscount(
        discount.id,
        discount.name,
        discount.percentage,
        !discount.adminOnly
      );
      fetchDiscounts();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update discount');
    }
  };

  const stats = {
    total: discounts.length,
    active: discounts.length,  // All discounts are considered active
    adminOnly: discounts.filter((d) => d.adminOnly).length,
  };

  const renderDiscount = ({ item }: { item: Discount }) => (
    <View style={[styles.discountCard, { backgroundColor: COLORS.cardBackground }]}>
      <View style={styles.discountHeader}>
        <View style={[styles.discountIcon, { backgroundColor: '#F3E8FF' }]}>
          <Icon name="percent" size={24} color="#9333EA" />
        </View>
        <View style={styles.discountActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
            onPress={() => openEditModal(item)}
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
      </View>

      <Text style={[styles.discountName, { color: COLORS.textPrimary }]}>{item.name}</Text>
      <Text style={[styles.discountValue, { color: '#7CC39F' }]}>
        {(item.percentage * 100).toFixed(0)}% <Text style={styles.offText}>OFF</Text>
      </Text>

      <View style={styles.badgeContainer}>
        <View style={[styles.badge, { backgroundColor: COLORS.backgroundSecondary }]}>
          <Text style={[styles.badgeText, { color: COLORS.textSecondary }]}>Percentage</Text>
        </View>
      </View>

      {/* Admin Only Toggle */}
      <View style={[styles.adminToggleRow, { borderTopColor: COLORS.border }]}>
        <View style={styles.adminToggleLeft}>
          <Icon name="shield-lock-outline" size={16} color={item.adminOnly ? '#D97706' : COLORS.textTertiary} />
          <Text style={[styles.adminToggleLabel, { color: item.adminOnly ? '#D97706' : COLORS.textSecondary }]}>
            Manager Only
          </Text>
        </View>
        <Switch
          value={item.adminOnly || false}
          onValueChange={() => toggleAdminOnly(item)}
          trackColor={{ false: COLORS.border, true: '#FCD34D' }}
          thumbColor={item.adminOnly ? '#D97706' : '#FFF'}
          style={styles.adminSwitch}
        />
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitle}>
              <View style={styles.headerIconContainer}>
                <Icon name="percent" size={28} color="#000" />
              </View>
              <View>
                <Text style={[styles.title, { color: COLORS.textPrimary }]}>Discounts</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                  Manage promotional offers
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
              <Icon name="plus" size={20} color="#000" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        {!isLoading && discounts.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
              <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                <Icon name="tag-multiple" size={20} color="#9333EA" />
              </View>
              <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Total</Text>
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
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="shield-lock" size={20} color="#D97706" />
              </View>
              <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Restricted</Text>
              <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.adminOnly}</Text>
            </View>
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7CC39F" />
          </View>
        ) : discounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Icon name="tag-off" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No discounts found</Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
              Create your first discount to start running promotions.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
              <Text style={styles.emptyButtonText}>Create Discount</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={discounts}
            keyExtractor={(item) => item.id}
            renderItem={renderDiscount}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />
            }
          />
        )}

        {/* Discount Modal */}
        <DiscountModal
          isVisible={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSubmit}
          discount={editingDiscount}
        />

        {/* Delete Confirmation */}
        <ConfirmationModal
          isVisible={showDeleteConfirm}
          title="Delete Discount"
          message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  discountCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  discountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  discountIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  discountValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  offText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  adminToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminToggleLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  adminSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
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
});

export default DiscountsScreen;
