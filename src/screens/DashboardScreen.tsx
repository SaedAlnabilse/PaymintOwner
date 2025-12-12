import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Animated, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { ScreenContainer } from '../components/ScreenContainer';
import { RootState } from '../store/store';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { getOwnerDashboard, OwnerDashboard, DashboardSummary } from '../services/dashboard';

const DashboardScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const navigation = useNavigation<any>();

  const { user } = useSelector((state: RootState) => state.auth);

  const [ownerData, setOwnerData] = useState<OwnerDashboard | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const loadData = useCallback(async () => {
    try {
      setError(null);
      // Don't set loading true on refresh to avoid flickering
      if (!refreshing && !dashboardData) setLoading(true);

      // OPTIMIZED: Single API call for all dashboard data
      const data = await getOwnerDashboard();
      setOwnerData(data);
      setDashboardData(data.metrics);

      console.log(`✅ Dashboard loaded in single API call (store: ${data.storeStatus}, alerts: ${data.cashAlerts.unreadCount})`);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, dashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true }),
      ]).start();

      // Polling for live updates - reduced frequency to avoid rate limiting
      const intervalId = setInterval(() => {
        loadData();
      }, 15000); // Fetch every 15 seconds (reduced from 5 to avoid 429 errors)

      return () => {
        clearInterval(intervalId);
      };
    }, [loadData])
  );

  const formatCurrency = (amount: number) => {
    return `${amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} JOD`;
  };

  const styles = createStyles(COLORS);

  const MetricCard = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: isDarkMode ? `${color}26` : COLORS.containerGray }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  // Error State
  if (error && !dashboardData) {
    return (
      <ScreenContainer style={{ backgroundColor: COLORS.background }}>
        <View style={styles.centerContainer}>
          <View style={[styles.errorIconContainer, { backgroundColor: COLORS.errorBg }]}>
            <Icon name="alert-circle-outline" size={56} color={COLORS.errorText} />
          </View>
          <Text style={[styles.errorText, { color: COLORS.textPrimary }]}>Failed To Load Dashboard</Text>
          <Text style={[styles.errorSubText, { color: COLORS.textSecondary }]}>{error || 'Please Check Your Connection'}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: COLORS.primary }]} onPress={loadData}>
            <Icon name="refresh" size={20} color="#FFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Loading State
  if (loading && !dashboardData) {
    return (
      <ScreenContainer style={{ backgroundColor: COLORS.background }}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>Loading Dashboard...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Handle both nested metrics (old) and flat structure (new)
  const metrics = dashboardData?.metrics || (dashboardData ? {
    totalSales: (dashboardData as any).totalSales || (dashboardData as any).netSales || 0,
    cashSales: (dashboardData as any).cashSales || 0,
    cardSales: (dashboardData as any).cardSales || 0,
    orderCount: (dashboardData as any).orderCount || (dashboardData as any).numberOfOrders || 0,
    totalPayOut: (dashboardData as any).totalPayOut || (dashboardData as any).payOut || 0
  } : {
    totalSales: 0,
    cashSales: 0,
    cardSales: 0,
    orderCount: 0,
    totalPayOut: 0
  });

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: COLORS.textSecondary }]}>
            Hello, {user?.name?.split(' ')[0] || 'Owner'} 👋
          </Text>
          <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Dashboard</Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          style={[styles.menuButton, { backgroundColor: COLORS.containerGray }]}
        >
          <Icon name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Featured Sales Card with Store Status */}
          <View style={styles.featuredCard}>
            <View style={styles.featuredCardHeader}>
              <Text style={styles.featuredCardLabel}>Today's Sales</Text>
              {(ownerData?.storeStatus === 'OPEN' || dashboardData?.shiftStatus === 'ACTIVE') ? (
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#FFFFFF' }]} />
                  <Text style={styles.statusIndicatorText}>Store Open</Text>
                </View>
              ) : (
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: COLORS.error }]} />
                  <Text style={styles.statusIndicatorText}>Store Closed</Text>
                </View>
              )}
            </View>
            <Text style={styles.featuredCardValue}>{formatCurrency(metrics.totalSales)}</Text>
            {/* Cash Alert Badge */}
            {ownerData?.cashAlerts?.unreadCount > 0 && (
              <TouchableOpacity
                style={styles.alertBadge}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Icon name="alert-circle" size={16} color="#FFF" />
                <Text style={styles.alertBadgeText}>
                  {ownerData.cashAlerts.unreadCount} Cash Alert{ownerData.cashAlerts.unreadCount > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Metrics Grid */}
          <View style={styles.statsGrid}>
            <MetricCard
              title="Orders"
              value={metrics.orderCount}
              icon="receipt"
              color={COLORS.neutralGray}
            />
            <MetricCard
              title="Cash"
              value={formatCurrency(metrics.cashSales)}
              icon="cash"
              color={COLORS.primary}
            />
            <MetricCard
              title="Card"
              value={formatCurrency(metrics.cardSales)}
              icon="credit-card"
              color={COLORS.graphGray}
            />
            <MetricCard
              title="Average"
              value={formatCurrency(metrics.orderCount > 0 ? metrics.totalSales / metrics.orderCount : 0)}
              icon="chart-line"
              color={COLORS.alertYellow}
            />
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="lightning-bolt" size={20} color={COLORS.alertYellow} />
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Reports')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.15)' : COLORS.containerGray }]}>
                  <Icon name="chart-box" size={28} color={COLORS.graphGray} />
                </View>
                <Text style={styles.actionText}>Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Inventory')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : COLORS.containerGray }]}>
                  <Icon name="package-variant" size={28} color={COLORS.alertYellow} />
                </View>
                <Text style={styles.actionText}>Inventory</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Staff')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(168, 187, 191, 0.15)' : COLORS.containerGray }]}>
                  <Icon name="account-group" size={28} color={COLORS.neutralGray} />
                </View>
                <Text style={styles.actionText}>Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? 'rgba(176, 179, 184, 0.15)' : COLORS.containerGray }]}>
                  <Icon name="cog" size={28} color={COLORS.textSecondary} />
                </View>
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.errorBg,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  errorSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android Shadow
    elevation: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 20,
    marginTop: 10, // Reduced since SafeAreaView now handles the top spacing
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android Shadow
    elevation: 4,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.containerGray,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  featuredCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    // iOS Shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    // Android Shadow
    elevation: 8,
  },
  featuredCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredCardLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusIndicatorText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  featuredCardValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  alertBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android Shadow
    elevation: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Android Shadow
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    width: '22%',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.1,
    color: colors.textPrimary,
  },
});

export default DashboardScreen;
