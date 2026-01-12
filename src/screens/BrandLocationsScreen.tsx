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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { apiClient } from '../services/apiClient';
import ConfirmationModal from '../components/common/ConfirmationModal';

interface BrandLocation {
  id: string;
  name: string;
  establishmentLoginId: string;
  type: string;
  address?: string;
  phone?: string;
  status: 'OPEN' | 'CLOSED';
  subscriptionStatus: string;
  todaySales: number;
  ordersToday: number;
  staffCount: number;
}

const BrandLocationsScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const brandId = route.params?.brandId;

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [locations, setLocations] = useState<BrandLocation[]>([]);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<BrandLocation | null>(null);

  useEffect(() => {
    fetchLocations();
  }, [brandId]);

  const fetchLocations = async () => {
    try {
      if (!refreshing) setIsLoading(true);

      const response = await apiClient.get(`/api/brands/${brandId}/locations`);

      if (response.data) {
        setBrandName(response.data.brandName || '');
        setLocations(response.data.locations || []);
      }
    } catch (err) {
      console.error('Failed to fetch brand locations:', err);
      // Mock data
      setBrandName('Coffee House');
      setLocations([
        {
          id: '1',
          name: 'Downtown Branch',
          establishmentLoginId: 'downtown',
          type: 'cafe',
          address: '123 Main St, Amman',
          phone: '+962 7XX XXX XXX',
          status: 'OPEN',
          subscriptionStatus: 'ACTIVE',
          todaySales: 1250,
          ordersToday: 45,
          staffCount: 4,
        },
        {
          id: '2',
          name: 'Mall Branch',
          establishmentLoginId: 'mall',
          type: 'cafe',
          address: 'City Mall, Ground Floor',
          phone: '+962 7XX XXX XXX',
          status: 'OPEN',
          subscriptionStatus: 'ACTIVE',
          todaySales: 980,
          ordersToday: 32,
          staffCount: 3,
        },
        {
          id: '3',
          name: 'Airport Branch',
          establishmentLoginId: 'airport',
          type: 'cafe',
          address: 'Queen Alia Airport, Terminal 1',
          phone: '+962 7XX XXX XXX',
          status: 'CLOSED',
          subscriptionStatus: 'ACTIVE',
          todaySales: 0,
          ordersToday: 0,
          staffCount: 2,
        },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLocations();
  }, [brandId]);

  const handleUnlinkLocation = (location: BrandLocation) => {
    setUnlinkTarget(location);
    setShowUnlinkConfirm(true);
  };

  const confirmUnlink = async () => {
    if (!unlinkTarget) return;
    try {
      await apiClient.delete(`/api/brands/${brandId}/locations/${unlinkTarget.id}`);
      setShowUnlinkConfirm(false);
      setUnlinkTarget(null);
      fetchLocations();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to unlink location');
    }
  };

  const handleAddLocation = () => {
    Alert.alert('Coming Soon', 'Add location to brand feature coming soon.');
  };

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} JOD`;
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'restaurant':
        return 'silverware-fork-knife';
      case 'cafe':
        return 'coffee';
      case 'bar':
        return 'glass-cocktail';
      case 'bakery':
        return 'cake-variant';
      case 'retail':
        return 'store';
      default:
        return 'store';
    }
  };

  const stats = {
    total: locations.length,
    open: locations.filter((l) => l.status === 'OPEN').length,
    totalSales: locations.reduce((sum, l) => sum + l.todaySales, 0),
  };

  const renderLocation = ({ item }: { item: BrandLocation }) => {
    const isOpen = item.status === 'OPEN';

    return (
      <View style={[styles.locationCard, { backgroundColor: COLORS.cardBackground }]}>
        <View style={styles.locationHeader}>
          <View style={[styles.locationIcon, { backgroundColor: isOpen ? '#E8F5E9' : '#F5F5F5' }]}>
            <Icon name={getTypeIcon(item.type)} size={24} color={isOpen ? '#2E7D32' : '#757575'} />
          </View>
          <View style={styles.locationInfo}>
            <View style={styles.locationNameRow}>
              <Text style={[styles.locationName, { color: COLORS.textPrimary }]}>{item.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isOpen ? '#E8F5E9' : '#F5F5F5' },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: isOpen ? '#2E7D32' : '#757575' }]} />
                <Text style={[styles.statusText, { color: isOpen ? '#2E7D32' : '#757575' }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={[styles.locationSlug, { color: COLORS.textSecondary }]}>@{item.establishmentLoginId}</Text>
          </View>
        </View>

        {item.address && (
          <View style={styles.locationMeta}>
            <Icon name="map-marker" size={14} color={COLORS.textSecondary} />
            <Text style={[styles.locationMetaText, { color: COLORS.textSecondary }]} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        )}

        <View style={styles.locationStats}>
          <View style={styles.locationStatItem}>
            <Text style={[styles.locationStatLabel, { color: COLORS.textSecondary }]}>Today's Sales</Text>
            <Text style={[styles.locationStatValue, { color: '#7CC39F' }]}>
              {formatCurrency(item.todaySales)}
            </Text>
          </View>
          <View style={styles.locationStatItem}>
            <Text style={[styles.locationStatLabel, { color: COLORS.textSecondary }]}>Orders</Text>
            <Text style={[styles.locationStatValue, { color: COLORS.textPrimary }]}>{item.ordersToday}</Text>
          </View>
          <View style={styles.locationStatItem}>
            <Text style={[styles.locationStatLabel, { color: COLORS.textSecondary }]}>Staff</Text>
            <Text style={[styles.locationStatValue, { color: COLORS.textPrimary }]}>{item.staffCount}</Text>
          </View>
        </View>

        <View style={styles.locationActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
            onPress={() => Alert.alert('Coming Soon', 'View location reports coming soon.')}
          >
            <Icon name="chart-bar" size={16} color={COLORS.textSecondary} />
            <Text style={[styles.actionBtnText, { color: COLORS.textSecondary }]}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
            onPress={() => Alert.alert('Coming Soon', 'Manage location coming soon.')}
          >
            <Icon name="cog" size={16} color={COLORS.textSecondary} />
            <Text style={[styles.actionBtnText, { color: COLORS.textSecondary }]}>Manage</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unlinkBtn, { backgroundColor: '#FEE2E2' }]}
            onPress={() => handleUnlinkLocation(item)}
          >
            <Icon name="link-off" size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: COLORS.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>{brandName}</Text>
              <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Locations</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddLocation}>
              <Icon name="plus" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="store" size={20} color="#1976D2" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Total</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{stats.total}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="check-circle" size={20} color="#2E7D32" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Open</Text>
            <Text style={[styles.statValue, { color: '#7CC39F' }]}>{stats.open}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
              <Icon name="trending-up" size={20} color="#7CC39F" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Sales</Text>
            <Text style={[styles.statValue, { color: '#7CC39F' }]}>{formatCurrency(stats.totalSales)}</Text>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7CC39F" />
          </View>
        ) : locations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Icon name="store-off" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No locations</Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
              Add establishments to this brand to manage them together.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddLocation}>
              <Text style={styles.emptyButtonText}>Add Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={locations}
            keyExtractor={(item) => item.id}
            renderItem={renderLocation}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />
            }
          />
        )}

        {/* Unlink Confirmation */}
        <ConfirmationModal
          isVisible={showUnlinkConfirm}
          title="Unlink Location"
          message={`Are you sure you want to remove "${unlinkTarget?.name}" from this brand?`}
          confirmText="Unlink"
          confirmColor="#DC2626"
          onConfirm={confirmUnlink}
          onCancel={() => {
            setShowUnlinkConfirm(false);
            setUnlinkTarget(null);
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#7CC39F',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 16,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  locationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  locationSlug: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationMetaText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  locationStats: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  locationStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  locationStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  locationStatValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unlinkBtn: {
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
});

export default BrandLocationsScreen;
