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
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { salesSettingsService } from '../services/salesSettings';
import PaymentMethodModal from '../components/settings/PaymentMethodModal';
import CardTypeModal from '../components/settings/CardTypeModal';
import ConfirmationModal from '../components/common/ConfirmationModal';

interface PaymentMethod {
  id: string;
  name: string;
  logo?: string;
  isActive?: boolean;
}

interface CardType {
  id: string;
  name: string;
  logo?: string;
  isActive?: boolean;
}

const PaymentMethodsScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'payments' | 'cards'>('payments');

  // Payment Method Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);

  // Card Type Modal
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCardType, setEditingCardType] = useState<CardType | null>(null);

  // Delete Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'payment' | 'card'; item: any } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!refreshing) setIsLoading(true);
      const settings = await salesSettingsService.getAppSettings();
      setPaymentMethods(settings.paymentMethods || []);
      setCardTypes(settings.cardTypes || []);
    } catch (err) {
      console.error('Failed to fetch payment settings:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // Payment Method handlers
  const handleAddPaymentMethod = () => {
    setEditingPaymentMethod(null);
    setShowPaymentModal(true);
  };

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    setEditingPaymentMethod(method);
    setShowPaymentModal(true);
  };

  const handleSubmitPaymentMethod = async (name: string, logoFile?: any, id?: string) => {
    try {
      setIsSubmitting(true);
      if (id) {
        await salesSettingsService.updatePaymentMethod(id, name, logoFile);
      } else {
        await salesSettingsService.addPaymentMethod(name, logoFile);
      }
      setShowPaymentModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Card Type handlers
  const handleAddCardType = () => {
    setEditingCardType(null);
    setShowCardModal(true);
  };

  const handleEditCardType = (card: CardType) => {
    setEditingCardType(card);
    setShowCardModal(true);
  };

  const handleSubmitCardType = async (name: string, logoFile?: any, id?: string) => {
    try {
      setIsSubmitting(true);
      if (id) {
        await salesSettingsService.updateCardType(id, name, logoFile);
      } else {
        await salesSettingsService.addCardType(name, logoFile);
      }
      setShowCardModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save card type');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete handlers
  const confirmDelete = (type: 'payment' | 'card', item: any) => {
    setDeleteTarget({ type, item });
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'payment') {
        await salesSettingsService.deletePaymentMethod(deleteTarget.item.id);
      } else {
        await salesSettingsService.deleteCardType(deleteTarget.item.id);
      }
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete');
    }
  };

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <View style={[styles.itemCard, { backgroundColor: COLORS.cardBackground }]}>
      <View style={styles.itemContent}>
        <View style={[styles.itemIcon, { backgroundColor: '#E3F2FD' }]}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.itemLogo} resizeMode="contain" />
          ) : (
            <Icon name="wallet-outline" size={24} color="#1976D2" />
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: COLORS.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.itemType, { color: COLORS.textSecondary }]}>Payment Method</Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
          onPress={() => handleEditPaymentMethod(item)}
        >
          <Icon name="pencil" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
          onPress={() => confirmDelete('payment', item)}
        >
          <Icon name="trash-can-outline" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCardType = ({ item }: { item: CardType }) => (
    <View style={[styles.itemCard, { backgroundColor: COLORS.cardBackground }]}>
      <View style={styles.itemContent}>
        <View style={[styles.itemIcon, { backgroundColor: '#FFF3E0' }]}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.itemLogo} resizeMode="contain" />
          ) : (
            <Icon name="credit-card-outline" size={24} color="#EF6C00" />
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: COLORS.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.itemType, { color: COLORS.textSecondary }]}>Card Type</Text>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
          onPress={() => handleEditCardType(item)}
        >
          <Icon name="pencil" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
          onPress={() => confirmDelete('card', item)}
        >
          <Icon name="trash-can-outline" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const currentData = activeTab === 'payments' ? paymentMethods : cardTypes;

  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitle}>
              <View style={styles.headerIconContainer}>
                <Icon name="credit-card-multiple" size={28} color="#000" />
              </View>
              <View>
                <Text style={[styles.title, { color: COLORS.textPrimary }]}>Payment Config</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                  Manage payment options
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={activeTab === 'payments' ? handleAddPaymentMethod : handleAddCardType}
            >
              <Icon name="plus" size={20} color="#000" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'payments' && styles.tabActive,
              { backgroundColor: activeTab === 'payments' ? '#7CC39F' : COLORS.cardBackground },
            ]}
            onPress={() => setActiveTab('payments')}
          >
            <Icon
              name="wallet-outline"
              size={20}
              color={activeTab === 'payments' ? '#000' : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'payments' ? '#000' : COLORS.textSecondary },
              ]}
            >
              Payment Methods ({paymentMethods.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'cards' && styles.tabActive,
              { backgroundColor: activeTab === 'cards' ? '#7CC39F' : COLORS.cardBackground },
            ]}
            onPress={() => setActiveTab('cards')}
          >
            <Icon
              name="credit-card-outline"
              size={20}
              color={activeTab === 'cards' ? '#000' : COLORS.textSecondary}
            />
            <Text
              style={[styles.tabText, { color: activeTab === 'cards' ? '#000' : COLORS.textSecondary }]}
            >
              Card Types ({cardTypes.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7CC39F" />
          </View>
        ) : currentData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Icon
                name={activeTab === 'payments' ? 'wallet-outline' : 'credit-card-outline'}
                size={48}
                color={COLORS.textSecondary}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
              No {activeTab === 'payments' ? 'payment methods' : 'card types'} found
            </Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
              Add your first {activeTab === 'payments' ? 'payment method' : 'card type'} to accept
              payments.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={activeTab === 'payments' ? handleAddPaymentMethod : handleAddCardType}
            >
              <Text style={styles.emptyButtonText}>
                Add {activeTab === 'payments' ? 'Payment Method' : 'Card Type'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(item) => item.id}
            renderItem={activeTab === 'payments' ? renderPaymentMethod : renderCardType}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />
            }
          />
        )}

        {/* Payment Method Modal */}
        <PaymentMethodModal
          isVisible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSave={handleSubmitPaymentMethod}
          paymentMethod={editingPaymentMethod}
        />

        {/* Card Type Modal */}
        <CardTypeModal
          isVisible={showCardModal}
          onClose={() => setShowCardModal(false)}
          onSave={handleSubmitCardType}
          cardType={editingCardType}
        />

        {/* Delete Confirmation */}
        <ConfirmationModal
          isVisible={showDeleteConfirm}
          title={`Delete ${deleteTarget?.type === 'payment' ? 'Payment Method' : 'Card Type'}`}
          message={`Are you sure you want to delete "${deleteTarget?.item?.name}"?`}
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  tabActive: {
    shadowColor: '#7CC39F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemLogo: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemType: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemActions: {
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

export default PaymentMethodsScreen;
