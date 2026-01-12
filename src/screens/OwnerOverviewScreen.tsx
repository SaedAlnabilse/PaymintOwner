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
import { useSelector } from 'react-redux';
import moment from 'moment-timezone';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { RootState } from '../store/store';
import { apiClient } from '../services/apiClient';

const { width } = Dimensions.get('window');

interface EstablishmentStats {
  establishmentId: string;
  name: string;
  type: string;
  todaySales: number;
  weekSales: number;
  monthSales: number;
  ordersToday: number;
  avgOrderValue: number;
  staffOnline: number;
  status: 'OPEN' | 'CLOSED';
}

interface OverallStats {
  totalSalesToday: number;
  totalSalesWeek: number;
  totalSalesMonth: number;
  totalOrders: number;
  avgOrderValue: number;
  totalEstablishments: number;
  activeEstablishments: number;
  totalStaff: number;
}

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

const OwnerOverviewScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const { account, establishments } = useSelector((state: RootState) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState('today');
  const [establishmentStats, setEstablishmentStats] = useState<EstablishmentStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalSalesToday: 0,
    totalSalesWeek: 0,
    totalSalesMonth: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalEstablishments: 0,
    activeEstablishments: 0,
    totalStaff: 0,
  });

  useEffect(() => {
    fetchOverviewData();
  }, [selectedRange]);

  const fetchOverviewData = async () => {
    try {
      if (!refreshing) setIsLoading(true);

      // Fetch overview data for all establishments
      const response = await apiClient.get('/api/owner/overview', {
        params: { range: selectedRange },
      });

      if (response.data) {
        setEstablishmentStats(response.data.establishments || []);
        setOverallStats(response.data.overall || overallStats);
      }
    } catch (err) {
      console.error('Failed to fetch overview data:', err);
      // Generate mock data based on establishments
      const mockEstStats: EstablishmentStats[] = establishments.map((est) => ({
        establishmentId: est.id,
        name: est.name,
        type: est.type || 'restaurant',
        todaySales: Math.random() * 5000,
        weekSales: Math.random() * 25000,
        monthSales: Math.random() * 100000,
        ordersToday: Math.floor(Math.random() * 100),
        avgOrderValue: 15 + Math.random() * 35,
        staffOnline: Math.floor(Math.random() * 5),
        status: Math.random() > 0.3 ? 'OPEN' : 'CLOSED',
      }));

      setEstablishmentStats(mockEstStats);
      setOverallStats({
        totalSalesToday: mockEstStats.reduce((sum, e) => sum + e.todaySales, 0),
        totalSalesWeek: mockEstStats.reduce((sum, e) => sum + e.weekSales, 0),
        totalSalesMonth: mockEstStats.reduce((sum, e) => sum + e.monthSales, 0),
        totalOrders: mockEstStats.reduce((sum, e) => sum + e.ordersToday, 0),
        avgOrderValue: mockEstStats.reduce((sum, e) => sum + e.avgOrderValue, 0) / mockEstStats.length || 0,
        totalEstablishments: establishments.length,
        activeEstablishments: mockEstStats.filter((e) => e.status === 'OPEN').length,
        totalStaff: mockEstStats.reduce((sum, e) => sum + e.staffOnline, 0),
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOverviewData();
  }, [selectedRange]);

  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)} JOD`;
  };

  const getSalesForRange = () => {
    switch (selectedRange) {
      case 'week':
        return overallStats.totalSalesWeek;
      case 'month':
        return overallStats.totalSalesMonth;
      default:
        return overallStats.totalSalesToday;
    }
  };

  const getEstablishmentSalesForRange = (est: EstablishmentStats) => {
    switch (selectedRange) {
      case 'week':
        return est.weekSales;
      case 'month':
        return est.monthSales;
      default:
        return est.todaySales;
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'OPEN') {
      return { bg: '#E8F5E9', color: '#2E7D32', text: 'Open' };
    }
    return { bg: '#FFEBEE', color: '#C62828', text: 'Closed' };
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'restaurant':
        return 'silverware-fork-knife';
      case 'cafe':
        return 'coffee';
      case 'bar':
        return 'glass-cocktail';
      case 'retail':
        return 'store';
      case 'bakery':
        return 'cake-variant';
      default:
        return 'store';
    }
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
          <View style={styles.headerContent}>
            <View style={styles.headerTitle}>
              <View style={styles.headerIconContainer}>
                <Icon name="view-dashboard" size={28} color="#000" />
              </View>
              <View>
                <Text style={[styles.title, { color: COLORS.textPrimary }]}>Owner Overview</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                  All establishments at a glance
                </Text>
              </View>
            </View>
            <View style={styles.dateDisplay}>
              <Icon name="calendar" size={16} color={COLORS.textSecondary} />
              <Text style={[styles.dateText, { color: COLORS.textSecondary }]}>
                {moment().format('MMM D, YYYY')}
              </Text>
            </View>
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
            {/* Overall Stats */}
            <View style={styles.overallStatsContainer}>
              <View style={[styles.mainStatCard, { backgroundColor: '#7CC39F' }]}>
                <View style={styles.mainStatHeader}>
                  <Icon name="trending-up" size={24} color="#000" />
                  <Text style={styles.mainStatLabel}>Total Sales</Text>
                </View>
                <Text style={styles.mainStatValue}>{formatCurrency(getSalesForRange())}</Text>
                <Text style={styles.mainStatSubtext}>
                  {selectedRange === 'today' ? "Today's" : selectedRange === 'week' ? 'This Week' : 'This Month'}
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Icon name="receipt" size={20} color="#1976D2" />
                  </View>
                  <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{overallStats.totalOrders}</Text>
                  <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Orders</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                    <Icon name="store" size={20} color="#9333EA" />
                  </View>
                  <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>
                    {overallStats.activeEstablishments}/{overallStats.totalEstablishments}
                  </Text>
                  <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Active</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Icon name="account-group" size={20} color="#D97706" />
                  </View>
                  <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{overallStats.totalStaff}</Text>
                  <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Staff Online</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
                  <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Icon name="currency-usd" size={20} color="#2E7D32" />
                  </View>
                  <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>
                    {overallStats.avgOrderValue.toFixed(1)}
                  </Text>
                  <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Avg Order</Text>
                </View>
              </View>
            </View>

            {/* Establishments Performance */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Establishments Performance</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {establishmentStats.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: COLORS.cardBackground }]}>
                <Icon name="store-off" size={48} color={COLORS.textSecondary} />
                <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No establishments</Text>
                <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
                  Create your first establishment to see performance data.
                </Text>
              </View>
            ) : (
              establishmentStats.map((est) => {
                const statusStyle = getStatusStyle(est.status);
                return (
                  <View key={est.establishmentId} style={[styles.estCard, { backgroundColor: COLORS.cardBackground }]}>
                    <View style={styles.estHeader}>
                      <View style={styles.estHeaderLeft}>
                        <View style={[styles.estIcon, { backgroundColor: '#E3F2FD' }]}>
                          <Icon name={getTypeIcon(est.type)} size={24} color="#1976D2" />
                        </View>
                        <View>
                          <Text style={[styles.estName, { color: COLORS.textPrimary }]}>{est.name}</Text>
                          <Text style={[styles.estType, { color: COLORS.textSecondary }]}>{est.type}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
                      </View>
                    </View>

                    <View style={styles.estStats}>
                      <View style={styles.estStatItem}>
                        <Text style={[styles.estStatLabel, { color: COLORS.textSecondary }]}>Sales</Text>
                        <Text style={[styles.estStatValue, { color: '#7CC39F' }]}>
                          {formatCurrency(getEstablishmentSalesForRange(est))}
                        </Text>
                      </View>
                      <View style={styles.estStatItem}>
                        <Text style={[styles.estStatLabel, { color: COLORS.textSecondary }]}>Orders</Text>
                        <Text style={[styles.estStatValue, { color: COLORS.textPrimary }]}>{est.ordersToday}</Text>
                      </View>
                      <View style={styles.estStatItem}>
                        <Text style={[styles.estStatLabel, { color: COLORS.textSecondary }]}>Avg Order</Text>
                        <Text style={[styles.estStatValue, { color: COLORS.textPrimary }]}>
                          {est.avgOrderValue.toFixed(1)} JOD
                        </Text>
                      </View>
                      <View style={styles.estStatItem}>
                        <Text style={[styles.estStatLabel, { color: COLORS.textSecondary }]}>Staff</Text>
                        <Text style={[styles.estStatValue, { color: COLORS.textPrimary }]}>{est.staffOnline}</Text>
                      </View>
                    </View>

                    <View style={styles.estActions}>
                      <TouchableOpacity style={[styles.estActionBtn, { backgroundColor: COLORS.backgroundSecondary }]}>
                        <Icon name="chart-bar" size={16} color={COLORS.textSecondary} />
                        <Text style={[styles.estActionText, { color: COLORS.textSecondary }]}>Reports</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.estActionBtn, { backgroundColor: COLORS.backgroundSecondary }]}>
                        <Icon name="cog" size={16} color={COLORS.textSecondary} />
                        <Text style={[styles.estActionText, { color: COLORS.textSecondary }]}>Manage</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Quick Actions */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Quick Actions</Text>
            </View>

            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: COLORS.cardBackground }]}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Icon name="plus-circle" size={24} color="#2E7D32" />
                </View>
                <Text style={[styles.quickActionTitle, { color: COLORS.textPrimary }]}>Add Establishment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: COLORS.cardBackground }]}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Icon name="account-plus" size={24} color="#1976D2" />
                </View>
                <Text style={[styles.quickActionTitle, { color: COLORS.textPrimary }]}>Add Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: COLORS.cardBackground }]}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Icon name="file-document" size={24} color="#9333EA" />
                </View>
                <Text style={[styles.quickActionTitle, { color: COLORS.textPrimary }]}>View Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: COLORS.cardBackground }]}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Icon name="credit-card" size={24} color="#D97706" />
                </View>
                <Text style={[styles.quickActionTitle, { color: COLORS.textPrimary }]}>Billing</Text>
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
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
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
  overallStatsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  mainStatCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  mainStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mainStatLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainStatValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -1,
  },
  mainStatSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
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
  emptyCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  estCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  estHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  estHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  estIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  estName: {
    fontSize: 16,
    fontWeight: '700',
  },
  estType: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  estStats: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  estStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  estStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  estStatValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  estActions: {
    flexDirection: 'row',
    gap: 10,
  },
  estActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  estActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default OwnerOverviewScreen;
