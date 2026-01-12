import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import moment from 'moment-timezone';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { apiClient } from '../services/apiClient';

const { width } = Dimensions.get('window');

interface BrandStats {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  topSellingItem: string;
  locationsCount: number;
  activeLocations: number;
  staffCount: number;
  growthPercentage: number;
}

interface LocationPerformance {
  id: string;
  name: string;
  sales: number;
  orders: number;
  status: 'OPEN' | 'CLOSED';
}

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

const BrandDashboardScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const brandId = route.params?.brandId;

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState('today');
  const [brandName, setBrandName] = useState('');
  const [stats, setStats] = useState<BrandStats>({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    topSellingItem: '',
    locationsCount: 0,
    activeLocations: 0,
    staffCount: 0,
    growthPercentage: 0,
  });
  const [locationPerformance, setLocationPerformance] = useState<LocationPerformance[]>([]);

  useEffect(() => {
    fetchBrandData();
  }, [selectedRange, brandId]);

  const fetchBrandData = async () => {
    try {
      if (!refreshing) setIsLoading(true);

      const response = await apiClient.get(`/api/brands/${brandId}/dashboard`, {
        params: { range: selectedRange },
      });

      if (response.data) {
        setBrandName(response.data.name || '');
        setStats(response.data.stats || stats);
        setLocationPerformance(response.data.locations || []);
      }
    } catch (err) {
      console.error('Failed to fetch brand data:', err);
      // Mock data
      setBrandName('Coffee House');
      setStats({
        totalSales: 15600,
        totalOrders: 412,
        avgOrderValue: 37.86,
        topSellingItem: 'Cappuccino',
        locationsCount: 3,
        activeLocations: 2,
        staffCount: 12,
        growthPercentage: 15.3,
      });
      setLocationPerformance([
        { id: '1', name: 'Downtown', sales: 6500, orders: 172, status: 'OPEN' },
        { id: '2', name: 'Mall Branch', sales: 5200, orders: 145, status: 'OPEN' },
        { id: '3', name: 'Airport', sales: 3900, orders: 95, status: 'CLOSED' },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBrandData();
  }, [selectedRange, brandId]);

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} JOD`;
  };

  const getMaxSales = () => {
    return Math.max(...locationPerformance.map((l) => l.sales), 1);
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={[styles.container, { backgroundColor: COLORS.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: COLORS.cardBackground }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={[styles.brandBadge, { backgroundColor: '#F3E8FF' }]}>
                <Icon name="tag-heart" size={20} color="#9333EA" />
              </View>
              <View>
                <Text style={[styles.brandLabel, { color: COLORS.textSecondary }]}>Brand</Text>
                <Text style={[styles.brandName, { color: COLORS.textPrimary }]}>{brandName}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: COLORS.backgroundSecondary }]}
              onPress={() => navigation.navigate('BrandLocations', { brandId })}
            >
              <Icon name="store-cog" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Range Filter */}
        <View style={styles.dateFilterContainer}>
          {DATE_RANGES.map((range) => (
            <TouchableOpacity
              key={range.value}
              style={[
                styles.dateFilterBtn,
                selectedRange === range.value && styles.dateFilterBtnActive,
                { borderColor: selectedRange === range.value ? '#7CC39F' : COLORS.border },
              ]}
              onPress={() => setSelectedRange(range.value)}
            >
              <Text
                style={[
                  styles.dateFilterText,
                  { color: selectedRange === range.value ? '#7CC39F' : COLORS.textSecondary },
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7CC39F" />
          </View>
        ) : (
          <>
            {/* Main Stats */}
            <View style={[styles.mainStatCard, { backgroundColor: '#7CC39F' }]}>
              <View style={styles.mainStatHeader}>
                <View>
                  <Text style={styles.mainStatLabel}>TOTAL SALES</Text>
                  <Text style={styles.mainStatValue}>{formatCurrency(stats.totalSales)}</Text>
                </View>
                <View style={styles.growthBadge}>
                  <Icon
                    name={stats.growthPercentage >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={stats.growthPercentage >= 0 ? '#15803D' : '#DC2626'}
                  />
                  <Text
                    style={[
                      styles.growthText,
                      { color: stats.growthPercentage >= 0 ? '#15803D' : '#DC2626' },
                    ]}
                  >
                    {stats.growthPercentage >= 0 ? '+' : ''}
                    {stats.growthPercentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.mainStatFooter}>
                <View style={styles.mainStatItem}>
                  <Text style={styles.mainStatItemLabel}>Orders</Text>
                  <Text style={styles.mainStatItemValue}>{stats.totalOrders}</Text>
                </View>
                <View style={styles.mainStatDivider} />
                <View style={styles.mainStatItem}>
                  <Text style={styles.mainStatItemLabel}>Avg Order</Text>
                  <Text style={styles.mainStatItemValue}>{stats.avgOrderValue.toFixed(1)} JOD</Text>
                </View>
                <View style={styles.mainStatDivider} />
                <View style={styles.mainStatItem}>
                  <Text style={styles.mainStatItemLabel}>Locations</Text>
                  <Text style={styles.mainStatItemValue}>
                    {stats.activeLocations}/{stats.locationsCount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStatsContainer}>
              <View style={[styles.quickStatCard, { backgroundColor: COLORS.cardBackground }]}>
                <View style={[styles.quickStatIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Icon name="trophy" size={20} color="#2E7D32" />
                </View>
                <Text style={[styles.quickStatLabel, { color: COLORS.textSecondary }]}>Top Seller</Text>
                <Text style={[styles.quickStatValue, { color: COLORS.textPrimary }]} numberOfLines={1}>
                  {stats.topSellingItem || 'N/A'}
                </Text>
              </View>
              <View style={[styles.quickStatCard, { backgroundColor: COLORS.cardBackground }]}>
                <View style={[styles.quickStatIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Icon name="account-group" size={20} color="#1976D2" />
                </View>
                <Text style={[styles.quickStatLabel, { color: COLORS.textSecondary }]}>Staff</Text>
                <Text style={[styles.quickStatValue, { color: COLORS.textPrimary }]}>{stats.staffCount}</Text>
              </View>
            </View>

            {/* Location Performance */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Location Performance</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BrandLocations', { brandId })}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {locationPerformance.map((location) => {
              const barWidth = (location.sales / getMaxSales()) * 100;
              return (
                <View key={location.id} style={[styles.locationCard, { backgroundColor: COLORS.cardBackground }]}>
                  <View style={styles.locationHeader}>
                    <View style={styles.locationInfo}>
                      <Text style={[styles.locationName, { color: COLORS.textPrimary }]}>{location.name}</Text>
                      <View
                        style={[
                          styles.locationStatus,
                          { backgroundColor: location.status === 'OPEN' ? '#E8F5E9' : '#F5F5F5' },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: location.status === 'OPEN' ? '#2E7D32' : '#757575' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusLabel,
                            { color: location.status === 'OPEN' ? '#2E7D32' : '#757575' },
                          ]}
                        >
                          {location.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.locationSales}>
                      <Text style={[styles.salesValue, { color: '#7CC39F' }]}>
                        {formatCurrency(location.sales)}
                      </Text>
                      <Text style={[styles.ordersValue, { color: COLORS.textSecondary }]}>
                        {location.orders} orders
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.barBackground, { backgroundColor: COLORS.backgroundSecondary }]}>
                    <View style={[styles.barFill, { width: `${barWidth}%` }]} />
                  </View>
                </View>
              );
            })}

            {/* Quick Actions */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Quick Actions</Text>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: COLORS.cardBackground }]}
                onPress={() => navigation.navigate('BrandLocations', { brandId })}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Icon name="store" size={24} color="#1976D2" />
                </View>
                <Text style={[styles.actionLabel, { color: COLORS.textPrimary }]}>Locations</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: COLORS.cardBackground }]}
                onPress={() => navigation.navigate('BrandTeam', { brandId })}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Icon name="account-group" size={24} color="#9333EA" />
                </View>
                <Text style={[styles.actionLabel, { color: COLORS.textPrimary }]}>Team</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: COLORS.cardBackground }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Icon name="file-document" size={24} color="#D97706" />
                </View>
                <Text style={[styles.actionLabel, { color: COLORS.textPrimary }]}>Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionCard, { backgroundColor: COLORS.cardBackground }]}>
                <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Icon name="cog" size={24} color="#2E7D32" />
                </View>
                <Text style={[styles.actionLabel, { color: COLORS.textPrimary }]}>Settings</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
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
  headerTop: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  dateFilterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  dateFilterBtnActive: {
    backgroundColor: 'rgba(124, 195, 159, 0.1)',
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  mainStatCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  mainStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  mainStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 4,
  },
  mainStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  growthText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mainStatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  mainStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  mainStatDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  mainStatItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.5)',
    marginBottom: 4,
  },
  mainStatItemValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  quickStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7CC39F',
  },
  locationCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  locationSales: {
    alignItems: 'flex-end',
  },
  salesValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  ordersValue: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#7CC39F',
    borderRadius: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default BrandDashboardScreen;
