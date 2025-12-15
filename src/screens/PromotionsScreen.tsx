import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  Discount,
  CreateDiscountDto,
} from '../services/discounts';

const PromotionsScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);

  // State
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [discountName, setDiscountName] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; percentage?: string }>({});

  // Fetch discounts
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getDiscounts();
      setDiscounts(data);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      Alert.alert('Error', 'Failed to load discounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open add modal
  const openAddModal = () => {
    setEditingDiscount(null);
    setDiscountName('');
    setDiscountPercentage('');
    setErrors({});
    setModalVisible(true);
  };

  // Open edit modal
  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setDiscountName(discount.name);
    setDiscountPercentage((discount.percentage * 100).toString());
    setErrors({});
    setModalVisible(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { name?: string; percentage?: string } = {};

    if (!discountName.trim()) {
      newErrors.name = 'Name is required';
    }

    const percent = parseFloat(discountPercentage);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      newErrors.percentage = 'Enter a valid percentage (1-100)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save discount
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const percentage = parseFloat(discountPercentage) / 100; // Convert to decimal

      if (editingDiscount) {
        await updateDiscount(editingDiscount.id, {
          name: discountName.trim(),
          percentage,
        });
        Alert.alert('Success', `${discountName} has been updated`);
      } else {
        await createDiscount({
          name: discountName.trim(),
          percentage,
        });
        Alert.alert('Success', `${discountName} has been added`);
      }

      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving discount:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save discount');
    } finally {
      setSaving(false);
    }
  };

  // Delete discount
  const handleDelete = (discount: Discount) => {
    Alert.alert(
      'Delete Discount',
      `Are you sure you want to delete "${discount.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDiscount(discount.id);
              Alert.alert('Success', `${discount.name} has been removed`);
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete discount');
            }
          },
        },
      ]
    );
  };

  // Discount Card Component
  const DiscountCard = ({ item }: { item: Discount }) => (
    <View style={[styles.card, { backgroundColor: COLORS.cardBackground }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <View style={[styles.iconBadge, { backgroundColor: COLORS.primary + '20' }]}>
            <Icon name="tag-outline" size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={[styles.discountName, { color: COLORS.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.discountValue, { color: COLORS.primary }]}>
              {Math.round(item.percentage * 100)}% OFF
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.blue + '15' }]}
            onPress={() => openEditModal(item)}
          >
            <Icon name="pencil" size={18} color={COLORS.blue} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.red + '15' }]}
            onPress={() => handleDelete(item)}
          >
            <Icon name="delete" size={18} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Add/Edit Modal
  const DiscountModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardView}
        >
          <View style={[styles.modalContent, { backgroundColor: COLORS.cardBackground }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Icon name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>
                {editingDiscount ? 'Edit Discount' : 'Add Discount'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>Discount Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: COLORS.background, color: COLORS.textPrimary, borderColor: errors.name ? COLORS.red : COLORS.borderLight }
                  ]}
                  placeholder="e.g., Happy Hour, Staff Discount"
                  placeholderTextColor={COLORS.textSecondary}
                  value={discountName}
                  onChangeText={(text) => {
                    setDiscountName(text);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                />
                {errors.name && <Text style={[styles.errorText, { color: COLORS.red }]}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: COLORS.textSecondary }]}>Discount Percentage</Text>
                <View style={[
                  styles.percentageInputContainer,
                  { backgroundColor: COLORS.background, borderColor: errors.percentage ? COLORS.red : COLORS.borderLight }
                ]}>
                  <TextInput
                    style={[styles.percentageInput, { color: COLORS.textPrimary }]}
                    placeholder="10"
                    placeholderTextColor={COLORS.textSecondary}
                    value={discountPercentage}
                    onChangeText={(text) => {
                      setDiscountPercentage(text.replace(/[^0-9.]/g, ''));
                      if (errors.percentage) setErrors({ ...errors, percentage: undefined });
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.percentageSymbol, { color: COLORS.textSecondary }]}>%</Text>
                </View>
                {errors.percentage && <Text style={[styles.errorText, { color: COLORS.red }]}>{errors.percentage}</Text>}
              </View>

              {/* Preview */}
              {discountName && discountPercentage && !isNaN(parseFloat(discountPercentage)) && (
                <View style={[styles.preview, { backgroundColor: COLORS.primary + '10' }]}>
                  <Icon name="eye" size={20} color={COLORS.primary} />
                  <Text style={[styles.previewText, { color: COLORS.textPrimary }]}>
                    Preview: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>
                      {discountName} - {discountPercentage}% OFF
                    </Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: COLORS.borderLight }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>{editingDiscount ? 'Update' : 'Create'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: COLORS.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Discounts</Text>
          <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>
            Manage your store discounts
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: COLORS.primary }]}
          onPress={openAddModal}
        >
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>Loading discounts...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary }]}>
            <Icon name="information-outline" size={22} color={COLORS.primary} />
            <Text style={[styles.infoText, { color: COLORS.textPrimary }]}>
              Discounts created here are available in the POS app during checkout.
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
              <Icon name="tag-multiple" size={28} color={COLORS.primary} />
              <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{discounts.length}</Text>
              <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Total Discounts</Text>
            </View>
          </View>

          {/* Discounts List */}
          <Text style={[styles.sectionTitle, { color: COLORS.textSecondary }]}>ALL DISCOUNTS</Text>
          {discounts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: COLORS.cardBackground }]}>
              <Icon name="tag-off" size={48} color={COLORS.textSecondary} />
              <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No Discounts</Text>
              <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
                Create your first discount to get started
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: COLORS.primary }]}
                onPress={openAddModal}
              >
                <Icon name="plus" size={20} color="#FFF" />
                <Text style={styles.emptyButtonText}>Add Discount</Text>
              </TouchableOpacity>
            </View>
          ) : (
            discounts.map(discount => (
              <DiscountCard key={discount.id} item={discount} />
            ))
          )}
        </ScrollView>
      )}

      <DiscountModal />
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
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountName: {
    fontSize: 16,
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
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
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
    maxWidth: 420,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  percentageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingRight: 14,
  },
  percentageInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  percentageSymbol: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
  },
  previewText: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
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
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PromotionsScreen;
