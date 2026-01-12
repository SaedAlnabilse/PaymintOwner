import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Animated, ActivityIndicator, RefreshControl, Alert, Modal, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import moment from 'moment-timezone';

import { ScreenContainer } from '../components/ScreenContainer';
import { RootState } from '../store/store';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { getOwnerDashboard, OwnerDashboard, DashboardSummary, DashboardMetrics, getStaffOverview, StaffMember } from '../services/dashboard';
import { getSalesComparison, getSalesByCategory, SalesComparison, CategorySales, getHourlySales, HourlySales, fetchOrdersHistory, fetchOrderDetails } from '../services/reports';
import { HistoricalOrder, OrderDetails } from '../types/reports';

// Import new dashboard components
import SalesTrendChart from '../components/dashboard/SalesTrendChart';
import TopEmployeesCard from '../components/dashboard/TopEmployeesCard';
import RecentOrdersFeed from '../components/dashboard/RecentOrdersFeed';
import OrderDetailsModal from '../components/reports/OrderDetailsModal';

const DashboardScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const navigation = useNavigation<any>();

  const { user } = useSelector((state: RootState) => state.auth);

  // Time period options
  type TimePeriod = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth';
  const periodOptions: { key: TimePeriod; label: string; icon: string }[] = [
    { key: 'today', label: 'Today', icon: 'calendar-today' },
    { key: 'yesterday', label: 'Yesterday', icon: 'history' },
    { key: 'thisWeek', label: 'This Week', icon: 'calendar-week' },
    { key: 'lastWeek', label: 'Last Week', icon: 'calendar-arrow-left' },
    { key: 'thisMonth', label: 'This Month', icon: 'calendar-month' },
  ];

  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [ownerData, setOwnerData] = useState<OwnerDashboard | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [comparison, setComparison] = useState<SalesComparison | null>(null);
  const [categoryData, setCategoryData] = useState<CategorySales[]>([]);
  const [hourlySales, setHourlySales] = useState<HourlySales[]>([]);
  const [recentOrders, setRecentOrders] = useState<HistoricalOrder[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Order Detail Modal State
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetails | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Safe wrapper for orders history to prevent dashboard crash
  const safeFetchOrders = async (start: string, end: string) => {
    try {
      return await fetchOrdersHistory(start, end, { page: 1, limit: 20, status: 'ALL' });
    } catch (error) {
      console.warn('Failed to fetch recent orders:', error);
      return [];
    }
  };

  // Get date ranges based on selected period
  const getDateRanges = useCallback((period: TimePeriod) => {
    const now = moment().tz('Asia/Amman');
    let currentStart: moment.Moment;
    let currentEnd: moment.Moment;
    let previousStart: moment.Moment;
    let previousEnd: moment.Moment;

    switch (period) {
      case 'yesterday':
        currentStart = now.clone().subtract(1, 'day').startOf('day');
        currentEnd = now.clone().subtract(1, 'day').endOf('day');
        previousStart = now.clone().subtract(2, 'days').startOf('day');
        previousEnd = now.clone().subtract(2, 'days').endOf('day');
        break;
      case 'thisWeek':
        currentStart = now.clone().startOf('week');
        currentEnd = now.clone().endOf('day');
        previousStart = now.clone().subtract(1, 'week').startOf('week');
        previousEnd = now.clone().subtract(1, 'week').endOf('week');
        break;
      case 'lastWeek':
        currentStart = now.clone().subtract(1, 'week').startOf('week');
        currentEnd = now.clone().subtract(1, 'week').endOf('week');
        previousStart = now.clone().subtract(2, 'weeks').startOf('week');
        previousEnd = now.clone().subtract(2, 'weeks').endOf('week');
        break;
      case 'thisMonth':
        currentStart = now.clone().startOf('month');
        currentEnd = now.clone().endOf('day');
        previousStart = now.clone().subtract(1, 'month').startOf('month');
        previousEnd = now.clone().subtract(1, 'month').endOf('month');
        break;
      default: // today
        currentStart = now.clone().startOf('day');
        currentEnd = now.clone().endOf('day');
        previousStart = now.clone().subtract(1, 'day').startOf('day');
        previousEnd = now.clone().subtract(1, 'day').endOf('day');
    }

    return {
      currentStart: currentStart.toISOString(),
      currentEnd: currentEnd.toISOString(),
      previousStart: previousStart.toISOString(),
      previousEnd: previousEnd.toISOString(),
    };
  }, []);

  const loadData = useCallback(async (silent = false) => {
    try {
      setError(null);
      // Only show full loading overlay if explicit refresh or initial load
      if (!silent && !refreshing) setLoading(true);

      // Get date ranges based on selected period
      const { currentStart, currentEnd, previousStart, previousEnd } = getDateRanges(selectedPeriod);

      // Fetch all data in parallel - now including hourly sales, orders, and staff data
      const [newData, comparisonData, categories, hourlyData, ordersData, staffData] = await Promise.all([
        getOwnerDashboard(),
        getSalesComparison(currentStart, currentEnd, previousStart, previousEnd),
        getSalesByCategory(currentStart, currentEnd),
        getHourlySales(currentStart, currentEnd),
        safeFetchOrders(currentStart, currentEnd),
        getStaffOverview(),
      ]);

      // Update comparison and category data
      setComparison(comparisonData);
      setCategoryData(categories.slice(0, 5)); // Top 5 categories
      setHourlySales(hourlyData);
      setRecentOrders(ordersData || []);
      setStaffList(staffData?.staff || []);

      // Smart Update: Compare new data with current data to avoid unnecessary re-renders
      // and prevent "loading" flickering if data hasn't changed.
      // We exclude 'generatedAt' from comparison as that always changes.
      setOwnerData(currentData => {
        const hasChanges = !currentData ||
          JSON.stringify({ ...newData, generatedAt: '' }) !== JSON.stringify({ ...currentData, generatedAt: '' });

        if (hasChanges) {
          console.log(`✅ Dashboard data updated (Status: ${newData.storeStatus})`);
          setDashboardData(newData.metrics);
          return newData;
        } else {
          // console.log('⚡ Dashboard data identical, skipping render');
          return currentData;
        }
      });

    } catch (err: any) {
      if (!silent) setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, selectedPeriod, getDateRanges]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(false); // Manual refresh should show feedback eventually, but RefreshControl handles the UI here
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      // Use silent=true on focus so the user isn't annoyed by the loading overlay
      // unless data actually changes (which handles the update silently)
      loadData(true);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true }),
      ]).start();

      // Polling for live updates
      const intervalId = setInterval(() => {
        loadData(true); // Silent update
      }, 15000);

      return () => {
        clearInterval(intervalId);
      };
    }, [loadData])
  );

  const formatCurrency = (amount: number) => {
    return `${amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} JOD`;
  };

  const handleOrderPress = async (orderId: string) => {
    setLoadingOrderDetails(true);
    setShowOrderModal(true);
    try {
      const details = await fetchOrderDetails(orderId);
      setSelectedOrderDetails(details);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      Alert.alert('Error', 'Could not load order details');
      setShowOrderModal(false);
    } finally {
      setLoadingOrderDetails(false);
    }
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
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: COLORS.primary }]} onPress={() => loadData()}>
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
  // Use the metrics directly as they now match the backend interface
  let metrics = dashboardData || {
    netSales: 0,
    numberOfOrders: 0,
    cashSales: 0,
    cardSales: 0,
    otherPayments: 0,
    drawerAmount: 0,
    payIn: 0,
    payOut: 0,
    totalTimeWorked: '0 minutes',
    shiftStatus: 'CLOSED'
  };

  // If we are looking at a past period, override the main sales/orders metrics 
  // with the historical data from the comparison API
  if (selectedPeriod !== 'today' && comparison) {
    metrics = {
      ...metrics,
      netSales: comparison.current.totalSales,
      numberOfOrders: comparison.current.orderCount,
      // For historical periods, we might not have detailed breakdown like cardSales 
      // unless we fetch a detailed report. For now, we keep the live values or zero 
      // them out to avoid confusion? 
      // Better to zero them or hide them if data isn't available, but preserving layout 
      // is safer. Let's keep cardSales as 0 or estimated if possible.
      // Actually, let's leave cardSales/cashSales as 0 to indicate "N/A" for history 
      // rather than showing today's values which would be wrong.
      cashSales: 0,
      cardSales: 0,
    };
  }

  /* Loading Overlay Component */
  const LoadingOverlay = () => (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }]} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={[
          styles.loadingCard,
          { backgroundColor: isDarkMode ? COLORS.surface : '#FFFFFF' }
        ]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.textPrimary }]}>Updating Dashboard...</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      {/* Show overlay when loading AND we passed the initial load (so dashboardData exists) */}
      {(loading && dashboardData && !refreshing) && <LoadingOverlay />}

      {/* Show full screen loading only on initial load */}
      {(loading && !dashboardData) && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>Loading Dashboard...</Text>
        </View>
      )}

      {(!loading && !dashboardData && error) ? (
        <View style={styles.centerContainer}>
          <View style={[styles.errorIconContainer, { backgroundColor: COLORS.errorBg }]}>
            <Icon name="alert-circle-outline" size={56} color={COLORS.errorText} />
          </View>
          <Text style={[styles.errorText, { color: COLORS.textPrimary }]}>Failed To Load Dashboard</Text>
          <Text style={[styles.errorSubText, { color: COLORS.textSecondary }]}>{error || 'Please Check Your Connection'}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: COLORS.primary }]} onPress={() => loadData(false)}>
            <Icon name="refresh" size={20} color="#FFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTagline}>
                  HELLO, {user?.name ? user.name.split(' ')[0].toUpperCase() : 'OWNER'} 👋
                </Text>
                <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Dashboard</Text>
              </View>
              <TouchableOpacity
                onPress={onRefresh}
                style={[styles.actionButton, { backgroundColor: COLORS.containerGray }]}
              >
                <Icon name="refresh" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Compact Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.headerStatValue, { color: COLORS.textPrimary }]}>
                  {metrics.numberOfOrders || 0}
                </Text>
                <Text style={[styles.headerStatLabel, { color: COLORS.textSecondary }]}>Orders</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.headerStatValue, { color: COLORS.primary }]}>
                  {formatCurrency(metrics.netSales || 0).split(' ')[0]}
                </Text>
                <Text style={[styles.headerStatLabel, { color: COLORS.textSecondary }]}>Sales</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.headerStatValue, { color: (ownerData?.cashAlerts?.unreadCount ?? 0) > 0 ? COLORS.orange : COLORS.textTertiary }]}>
                  {ownerData?.cashAlerts?.unreadCount ?? 0}
                </Text>
                <Text style={[styles.headerStatLabel, { color: COLORS.textSecondary }]}>Alerts</Text>
              </View>
            </View>
          </View>

          {/* Time Period Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.periodSelector}
            contentContainerStyle={styles.periodSelectorContent}
          >
            {periodOptions.map((option) => {
              const isSelected = selectedPeriod === option.key;

              const ChipContent = (
                <View style={[
                  styles.periodChipInner,
                  !isSelected && {
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.borderLight,
                    borderWidth: 1,
                  }
                ]}>
                  <Icon
                    name={option.icon}
                    size={16}
                    color={isSelected ? '#FFF' : COLORS.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[
                    styles.periodChipText,
                    { color: isSelected ? '#FFF' : COLORS.textSecondary }
                  ]}>
                    {option.label}
                  </Text>
                </View>
              );

              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => {
                    setSelectedPeriod(option.key);
                    loadData(false);
                  }}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[COLORS.primary, '#5cb28d']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.periodChipGradient}
                    >
                      {ChipContent}
                    </LinearGradient>
                  ) : (
                    ChipContent
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* Shift Status Banner */}
              {selectedPeriod === 'today' && dashboardData && dashboardData.activeShift && (
                <View style={[
                  styles.shiftBanner,
                  {
                    backgroundColor: dashboardData.shiftStatus === 'ACTIVE'
                      ? `${COLORS.primary}26`
                      : `${COLORS.error}26`,
                    borderColor: dashboardData.shiftStatus === 'ACTIVE'
                      ? `${COLORS.primary}66`
                      : `${COLORS.error}66`
                  }
                ]}>
                  <View style={styles.shiftBannerLeft}>
                    <View style={[
                      styles.shiftStatusDot,
                      {
                        backgroundColor: dashboardData.shiftStatus === 'ACTIVE'
                          ? COLORS.primary
                          : COLORS.error
                      }
                    ]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.shiftBannerTitle, { color: COLORS.textPrimary }]}>
                        {dashboardData.shiftStatus === 'ACTIVE' ? 'Active Shift' : 'Last Shift'}
                      </Text>
                      <Text style={[styles.shiftBannerSubtitle, { color: COLORS.textSecondary }]}>
                        {dashboardData.shiftStatus === 'ACTIVE' ? 'Started' : 'Closed'} by {dashboardData.activeShift.user?.name || 'Staff'} at{' '}
                        {moment(dashboardData.activeShift.startTime).format('h:mm A')}
                        {dashboardData.shiftStatus === 'LAST_SHIFT' && dashboardData.activeShift.autoClose && (
                          <Text style={{ color: COLORS.error, fontWeight: '700' }}> (Automatically Cashed Out)</Text>
                        )}
                      </Text>
                      {dashboardData.shiftStatus === 'LAST_SHIFT' && dashboardData.activeShift.discrepancy !== undefined && dashboardData.activeShift.discrepancy !== 0 && (
                        <View style={[styles.discrepancyBadge, {
                          backgroundColor: COLORS.errorBg,
                          marginTop: 8,
                        }]}>
                          <Icon
                            name={dashboardData.activeShift.discrepancy > 0 ? "arrow-up-circle" : "arrow-down-circle"}
                            size={16}
                            color={COLORS.error}
                          />
                          <Text style={[styles.discrepancyText, { color: COLORS.error }]}>
                            {dashboardData.activeShift.discrepancy > 0 ? 'Overage' : 'Shortage'}: {dashboardData.activeShift.discrepancy > 0 ? '+' : ''}{dashboardData.activeShift.discrepancy?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.shiftBannerRight}>
                    <Text style={[styles.shiftBannerAmount, { color: COLORS.textPrimary }]}>
                      {formatCurrency(metrics.netSales || 0)}
                    </Text>
                    <Text style={[styles.shiftBannerLabel, { color: COLORS.textSecondary }]}>Shift Sales</Text>
                  </View>
                </View>
              )}

              {/* Featured Sales Card with Store Status */}
              <View style={styles.featuredCard}>
                <View style={styles.featuredCardHeader}>
                  <Text style={styles.featuredCardLabel}>
                    {periodOptions.find(p => p.key === selectedPeriod)?.label || 'Today'}'s Sales
                  </Text>
                </View>
                <Text style={styles.featuredCardValue}>{formatCurrency(metrics.netSales || 0)}</Text>

                {(ownerData?.cashAlerts?.unreadCount ?? 0) > 0 && (
                  <TouchableOpacity
                    style={styles.alertBadge}
                    onPress={() => navigation.navigate('Notifications')}
                  >
                    <Icon name="alert-circle" size={16} color="#FFF" />
                    <Text style={styles.alertBadgeText}>
                      {ownerData?.cashAlerts?.unreadCount ?? 0} Cash Alert{(ownerData?.cashAlerts?.unreadCount ?? 0) > 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Metrics Grid with Comparison */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderLeftColor: COLORS.neutralGray }]}>
                  <View style={[styles.statIcon, { backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.15)' : COLORS.containerGray }]}>
                    <Icon name="receipt" size={24} color={COLORS.neutralGray} />
                  </View>
                  <Text style={styles.statLabel}>Receipts</Text>
                  <Text style={styles.statValue}>{metrics.numberOfOrders || 0}</Text>
                  {comparison && (
                    <View style={[styles.comparisonBadge, { backgroundColor: comparison.percentageChange.orders >= 0 ? COLORS.successBg : COLORS.errorBg }]}>
                      <Icon
                        name={comparison.percentageChange.orders >= 0 ? 'arrow-up' : 'arrow-down'}
                        size={12}
                        color={comparison.percentageChange.orders >= 0 ? COLORS.primary : COLORS.error}
                      />
                      <Text style={[styles.comparisonText, { color: comparison.percentageChange.orders >= 0 ? COLORS.primary : COLORS.error }]}>
                        {Math.abs(comparison.percentageChange.orders).toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
                  <View style={[styles.statIcon, { backgroundColor: isDarkMode ? 'rgba(124, 195, 159, 0.15)' : COLORS.containerGray }]}>
                    <Icon name="cash-multiple" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.statLabel}>Net Sales</Text>
                  <Text style={styles.statValue}>{formatCurrency(metrics.netSales || 0)}</Text>
                  {comparison && (
                    <View style={[styles.comparisonBadge, { backgroundColor: comparison.percentageChange.sales >= 0 ? COLORS.successBg : COLORS.errorBg }]}>
                      <Icon
                        name={comparison.percentageChange.sales >= 0 ? 'arrow-up' : 'arrow-down'}
                        size={12}
                        color={comparison.percentageChange.sales >= 0 ? COLORS.primary : COLORS.error}
                      />
                      <Text style={[styles.comparisonText, { color: comparison.percentageChange.sales >= 0 ? COLORS.primary : COLORS.error }]}>
                        {Math.abs(comparison.percentageChange.sales).toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.statCard, { borderLeftColor: COLORS.alertYellow }]}>
                  <View style={[styles.statIcon, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : COLORS.containerGray }]}>
                    <Icon name="chart-line" size={24} color={COLORS.alertYellow} />
                  </View>
                  <Text style={styles.statLabel}>Average Sale</Text>
                  <Text style={styles.statValue}>{formatCurrency((metrics.numberOfOrders || 0) > 0 ? (metrics.netSales || 0) / metrics.numberOfOrders : 0)}</Text>
                  {comparison && (
                    <View style={[styles.comparisonBadge, { backgroundColor: comparison.percentageChange.average >= 0 ? COLORS.successBg : COLORS.errorBg }]}>
                      <Icon
                        name={comparison.percentageChange.average >= 0 ? 'arrow-up' : 'arrow-down'}
                        size={12}
                        color={comparison.percentageChange.average >= 0 ? COLORS.primary : COLORS.error}
                      />
                      <Text style={[styles.comparisonText, { color: comparison.percentageChange.average >= 0 ? COLORS.primary : COLORS.error }]}>
                        {Math.abs(comparison.percentageChange.average).toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.statCard, { borderLeftColor: COLORS.graphGray }]}>
                  <View style={[styles.statIcon, { backgroundColor: isDarkMode ? 'rgba(148, 163, 184, 0.15)' : COLORS.containerGray }]}>
                    <Icon name="credit-card" size={24} color={COLORS.graphGray} />
                  </View>
                  <Text style={styles.statLabel}>Card Sales</Text>
                  <Text style={styles.statValue}>{formatCurrency(metrics.cardSales || 0)}</Text>
                </View>
              </View>

              {/* Sales by Category */}
              {categoryData.length > 0 && (
                <View style={[styles.section, { marginBottom: 24 }]}>
                  <View style={styles.sectionHeader}>
                    <Icon name="chart-pie" size={20} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Sales by Category</Text>
                  </View>
                  {categoryData.map((category, index) => (
                    <View key={category.categoryName} style={styles.categoryRow}>
                      <View style={styles.categoryInfo}>
                        <Text style={[styles.categoryName, { color: COLORS.textPrimary }]}>{category.categoryName}</Text>
                        <Text style={[styles.categoryAmount, { color: COLORS.textSecondary }]}>{formatCurrency(category.totalSales)}</Text>
                      </View>
                      <View style={styles.categoryBarContainer}>
                        <View
                          style={[
                            styles.categoryBar,
                            {
                              width: `${Math.min(category.percentage, 100)}%`,
                              backgroundColor: COLORS.primary + (index === 0 ? '' : (50 - index * 10).toString(16).padStart(2, '0'))
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.categoryPercentage, { color: COLORS.textSecondary }]}>
                        {category.percentage.toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Sales Trend Chart - Hourly Performance */}
              {(selectedPeriod === 'today' || selectedPeriod === 'yesterday') && hourlySales.length > 0 && (
                <SalesTrendChart
                  data={hourlySales}
                  title={`${periodOptions.find(p => p.key === selectedPeriod)?.label}'s Sales Trend`}
                />
              )}

              {/* Recent Orders Feed */}
              {recentOrders.length > 0 && (
                <RecentOrdersFeed
                  orders={recentOrders}
                  onOrderPress={handleOrderPress}
                  onViewAll={() => setShowAllOrdersModal(true)}
                  maxItems={5}
                />
              )}

              {/* Top Employees Card */}
              {staffList.length > 0 && (
                <TopEmployeesCard
                  employees={staffList}
                  onViewAll={() => navigation.navigate('Staff')}
                />
              )}



            </Animated.View>
          </ScrollView>
        </>
      )}

      <OrderDetailsModal
        visible={showOrderModal}
        onClose={() => {
          setShowOrderModal(false);
          setSelectedOrderDetails(null);
        }}
        order={selectedOrderDetails}
        isLoading={loadingOrderDetails}
      />

      {/* All Orders Modal */}
      <Modal
        visible={showAllOrdersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllOrdersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAllOrdersModal(false)} />
          <View style={[styles.allOrdersContainer, { backgroundColor: COLORS.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Recent Orders</Text>
                <Text style={[styles.modalSubtitle, { color: COLORS.textSecondary }]}>{recentOrders.length} orders total</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAllOrdersModal(false)}
                style={[styles.closeButton, { backgroundColor: COLORS.containerGray }]}
              >
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.allOrdersList}
            >
              {recentOrders.map((order) => {
                const getStatusColor = (order: HistoricalOrder) => {
                  if (order.isRefunded || order.status === 'REFUNDED') return { bg: COLORS.errorBg, text: COLORS.error, label: 'Refunded' };
                  if (order.status === 'COMPLETED') return { bg: COLORS.successBg, text: COLORS.primary, label: 'Completed' };
                  return { bg: COLORS.containerGray, text: COLORS.textSecondary, label: order.status };
                };
                const status = getStatusColor(order);

                return (
                  <TouchableOpacity
                    key={order.id}
                    onPress={() => {
                      // setShowAllOrdersModal(false); // User might want to go back to list, keep it open?
                      handleOrderPress(order.id);
                    }}
                    style={[styles.orderItemRow, { borderBottomColor: COLORS.borderLight }]}
                  >
                    <View style={styles.orderItemMain}>
                      <Text style={[styles.orderItemNumber, { color: COLORS.textPrimary }]}>#{order.orderNumber || order.id.slice(-6)}</Text>
                      <Text style={[styles.orderItemTime, { color: COLORS.textSecondary }]}>
                        {moment(order.createdAt).format('h:mm A')} • {order.paymentMethod || 'Cash'}
                      </Text>
                    </View>
                    <View style={styles.orderItemRight}>
                      <Text style={[styles.orderItemTotal, { color: COLORS.primary }]}>{formatCurrency(order.total)}</Text>
                      <View style={[styles.modalStatusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.modalStatusText, { color: status.text }]}>{status.label}</Text>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={20} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  loadingCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    minWidth: 180,
  },
  header: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.containerGray,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: { alignItems: 'center' },
  headerStatValue: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  headerStatLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 24, backgroundColor: colors.borderLight },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
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

  // Comparison Badge Styles
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  comparisonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Category Section Styles
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    width: 100,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 11,
    marginTop: 2,
  },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.containerGray,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    width: 35,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  // Period Selector Styles
  periodSelector: {
    marginTop: 12,
    marginBottom: 0,
    flexGrow: 0,
    minHeight: 54,
  },
  periodSelectorContent: {
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 2,
  },
  periodChipGradient: {
    borderRadius: 100,
    padding: 1, // Offset for the border effect if needed, but handled by Inner
  },
  periodChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    minHeight: 40,
    // iOS Shadow for selected
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  periodChipText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  shiftBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Android Shadow
    elevation: 4,
  },
  shiftBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  shiftStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  shiftBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  shiftBannerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  discrepancyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  discrepancyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  shiftBannerRight: {
    alignItems: 'flex-end',
  },
  shiftBannerAmount: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  shiftBannerLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  allOrdersContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    padding: 24,
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    // Android Shadow
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allOrdersList: {
    paddingBottom: 40,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  orderItemMain: {
    flex: 1,
  },
  orderItemNumber: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  orderItemTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  orderItemRight: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  orderItemTotal: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default DashboardScreen;
