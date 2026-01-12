import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector, useDispatch } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { RootState, AppDispatch } from '../store/store';
import { selectEstablishment } from '../store/slices/authSlice';
import ConfirmationModal from '../components/common/ConfirmationModal';

interface Establishment {
  id: string;
  name: string;
  establishmentLoginId: string;
  type: string;
  currency: string;
  subscriptionStatus: string;
  trialEndDate?: string;
}

const ESTABLISHMENT_ICONS: Record<string, string> = {
  restaurant: 'silverware-fork-knife',
  cafe: 'coffee',
  bar: 'glass-cocktail',
  retail: 'store',
  bakery: 'cake-variant',
  default: 'store',
};

const EstablishmentsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const dispatch = useDispatch<AppDispatch>();

  const { account, establishments, currentEstablishment } = useSelector(
    (state: RootState) => state.auth
  );

  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Establishment | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch establishments from API
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSelectEstablishment = (establishment: Establishment) => {
    dispatch(selectEstablishment(establishment));
    // Navigate back to main dashboard
    navigation.navigate('Dashboard');
  };

  const handleAddEstablishment = () => {
    // Navigate to onboarding or establishment creation
    Alert.alert('Coming Soon', 'Create establishment feature is coming soon in the app.');
  };

  const confirmDelete = (establishment: Establishment) => {
    setDeleteTarget(establishment);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // TODO: Implement delete establishment API call
    Alert.alert('Coming Soon', 'Delete establishment feature is coming soon.');
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#E8F5E9', color: '#2E7D32', text: 'Active' };
      case 'TRIALING':
        return { bg: '#E3F2FD', color: '#1976D2', text: 'Trial' };
      case 'PAST_DUE':
        return { bg: '#FFEBEE', color: '#C62828', text: 'Past Due' };
      case 'CANCELED':
        return { bg: '#F5F5F5', color: '#757575', text: 'Canceled' };
      default:
        return { bg: '#F5F5F5', color: '#757575', text: status };
    }
  };

  const stats = {
    total: establishments.length,
    active: establishments.filter((e) => e.subscriptionStatus === 'ACTIVE').length,
    trial: establishments.filter((e) => e.subscriptionStatus === 'TRIALING').length,
  };

  const renderEstablishment = ({ item }: { item: Establishment }) => {
    const statusStyle = getStatusStyle(item.subscriptionStatus);
    const isSelected = currentEstablishment?.id === item.id;
    const iconName = ESTABLISHMENT_ICONS[item.type?.toLowerCase()] || ESTABLISHMENT_ICONS.default;

    return (
      <TouchableOpacity
        style={[
          styles.establishmentCard,
          { backgroundColor: COLORS.cardBackground },
          isSelected && styles.establishmentCardSelected,
        ]}
        onPress={() => handleSelectEstablishment(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View
            style={[
              styles.establishmentIcon,
              { backgroundColor: isSelected ? '#7CC39F' : COLORS.backgroundSecondary },
            ]}
          >
            <Icon name={iconName} size={28} color={isSelected ? '#000' : COLORS.textSecondary} />
          </View>
          <View style={styles.establishmentInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.establishmentName, { color: COLORS.textPrimary }]}>
                {item.name}
              </Text>
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Icon name="check-circle" size={18} color="#7CC39F" />
                </View>
              )}
            </View>
            <Text style={[styles.establishmentSlug, { color: COLORS.textSecondary }]}>
              @{item.establishmentLoginId}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Icon name="tag-outline" size={14} color={COLORS.textSecondary} />
                <Text style={[styles.metaText, { color: COLORS.textSecondary }]}>{item.type}</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="currency-usd" size={14} color={COLORS.textSecondary} />
                <Text style={[styles.metaText, { color: COLORS.textSecondary }]}>
                  {item.currency}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
              onPress={() => {
                // TODO: Navigate to edit establishment
                Alert.alert('Coming Soon', 'Edit establishment feature is coming soon.');
              }}
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
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitle}>
              <View style={styles.headerIconContainer}>
                <Icon name="store-outline" size={28} color="#000" />
              </View>
              <View>
                <Text style={[styles.title, { color: COLORS.textPrimary }]}>Establishments</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                  Manage your locations
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddEstablishment}>
              <Icon name="plus" size={20} color="#000" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
              <Icon name="store" size={20} color="#9333EA" />
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
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="timer-sand" size={20} color="#1976D2" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Trial</Text>
            <Text style={[styles.statValue, { color: '#1976D2' }]}>{stats.trial}</Text>
          </View>
        </View>

        {/* Current Account */}
        {account && (
          <View style={[styles.accountCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={styles.accountAvatar}>
              <Text style={styles.accountAvatarText}>
                {account.firstName?.charAt(0) || ''}
                {account.lastName?.charAt(0) || ''}
              </Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={[styles.accountName, { color: COLORS.textPrimary }]}>
                {account.firstName} {account.lastName}
              </Text>
              <Text style={[styles.accountEmail, { color: COLORS.textSecondary }]}>
                {account.email}
              </Text>
            </View>
            <View style={styles.accountBadge}>
              <Text style={styles.accountBadgeText}>Owner</Text>
            </View>
          </View>
        )}

        {/* Establishments List */}
        {establishments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Icon name="store-off" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>
              No establishments yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
              Create your first establishment to get started.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddEstablishment}>
              <Text style={styles.emptyButtonText}>Create Establishment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={establishments}
            keyExtractor={(item) => item.id}
            renderItem={renderEstablishment}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />
            }
          />
        )}

        {/* Delete Confirmation */}
        <ConfirmationModal
          isVisible={showDeleteConfirm}
          title="Delete Establishment"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
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
  accountCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7CC39F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  accountAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
  },
  accountEmail: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  accountBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  accountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7CC39F',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  establishmentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  establishmentCardSelected: {
    borderWidth: 2,
    borderColor: '#7CC39F',
  },
  cardContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  establishmentIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  establishmentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  establishmentName: {
    fontSize: 18,
    fontWeight: '700',
  },
  selectedBadge: {
    marginLeft: 'auto',
  },
  establishmentSlug: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardActions: {
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

export default EstablishmentsScreen;
