import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScreenContainer } from '../components/ScreenContainer';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { getStaffOverview, StaffMember as StaffMemberType } from '../services/dashboard';

// Use the optimized StaffMember type from dashboard service
interface StaffMember extends StaffMemberType {
  // Additional fields if needed
}

const StaffScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const [searchQuery, setSearchQuery] = useState('');

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalStaff: 0,
    clockedIn: 0,
    activeCount: 0,
    offlineCount: 0
  });

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'manager': return COLORS.graphGray;
      case 'barista': return COLORS.warning;
      case 'server': return COLORS.neutralGray;
      case 'owner':
      case 'admin': return COLORS.primary;
      case 'cashier': return COLORS.neutralGray;
      default: return COLORS.textSecondary;
    }
  };

  const fetchStaffData = useCallback(async () => {
    try {
      // OPTIMIZED: Single API call to get all staff data
      const data = await getStaffOverview();
      
      // Map the response to our StaffMember interface
      const fetchedStaff: StaffMember[] = data.staff.map(user => ({
        ...user,
        status: user.isClockedIn ? 'Clocked In' : 'Clocked Out',
        todaySales: user.todaySales,
        todayHours: user.todayHours,
      }));

      setStaffList(fetchedStaff);
      setStats({
        totalStaff: data.summary.totalStaff,
        clockedIn: data.summary.clockedIn,
        activeCount: data.summary.clockedIn,
        offlineCount: data.summary.clockedOut,
      });

      console.log(`✅ Staff data loaded: ${fetchedStaff.length} users in single API call`);
    } catch (error) {
      console.error('Failed to fetch staff data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffData();

    // Poll for real-time updates every 15 seconds (aligned with Dashboard)
    const intervalId = setInterval(() => {
      fetchStaffData();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchStaffData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStaffData();
  };

  const filteredStaff = staffList.filter(staff =>
    staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StaffCard = ({ staff }: { staff: StaffMember }) => {
    const isClockedIn = staff.status === 'Clocked In';
    const roleColor = getRoleColor(staff.role);

    return (
      <View style={[styles.staffCard, { backgroundColor: COLORS.white }]}>
        <View style={styles.cardMain}>
          <View style={styles.staffLeft}>
            <View style={[styles.avatar, { backgroundColor: COLORS.containerGray }]}>
              <Text style={[styles.avatarText, { color: roleColor }]}>{staff.initials}</Text>
            </View>

            <View style={styles.staffInfo}>
              <Text style={[styles.userName, { color: COLORS.textPrimary }]}>{staff.name}</Text>
              <View style={styles.roleRow}>
                <View style={[styles.roleBadge, { backgroundColor: COLORS.containerGray }]}>
                  <Icon name="account-tie" size={12} color={roleColor} />
                  <Text style={[styles.roleText, { color: roleColor }]}>{staff.role}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.statusPill, { backgroundColor: isClockedIn ? COLORS.successBg : COLORS.errorBg }]}>
            <View style={[styles.statusDot, { backgroundColor: isClockedIn ? COLORS.primary : COLORS.error }]} />
            <Text style={[styles.statusText, { color: isClockedIn ? COLORS.primary : COLORS.error }]}>
              {isClockedIn ? 'Active' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.containerGray }]}>
              <Icon name="cash-multiple" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Today's Sales</Text>
              <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>
                {staff.todaySales.toLocaleString('en-US', { minimumFractionDigits: 2 })} JOD
              </Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.containerGray }]}>
              <Icon name="clock-outline" size={18} color={COLORS.neutralGray} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Hours Today</Text>
              <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>
                {staff.todayHours.toFixed(1)}h
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Staff Management</Text>
            <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>
              {stats.activeCount} active • {stats.offlineCount} offline
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: COLORS.primary }]}
            onPress={onRefresh}
          >
            <Icon name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: COLORS.textPrimary, backgroundColor: COLORS.surface }]}
            placeholder="Search staff by name..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Icon name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: COLORS.primary }]}>
              <View style={styles.summaryIconContainer}>
                <Icon name="account-group" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.summaryCardValue}>{stats.totalStaff}</Text>
              <Text style={styles.summaryCardLabel}>Total Staff</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: COLORS.primary }]}>
              <View style={styles.summaryIconContainer}>
                <Icon name="account-check" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.summaryCardValue}>{stats.clockedIn}</Text>
              <Text style={styles.summaryCardLabel}>Clocked In</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: COLORS.warning }]}>
              <View style={styles.summaryIconContainer}>
                <Icon name="percent" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.summaryCardValue}>--%</Text>
              <Text style={styles.summaryCardLabel}>Labor Cost</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="account-clock" size={18} color={COLORS.primary} />
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Active Now</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: COLORS.successBg }]}>
              <Text style={[styles.countBadgeText, { color: COLORS.primary }]}>
                {filteredStaff.filter(s => s.status === 'Clocked In').length}
              </Text>
            </View>
          </View>

          {filteredStaff.filter(s => s.status === 'Clocked In').map(staff => (
            <StaffCard key={staff.id} staff={staff} />
          ))}

          {filteredStaff.filter(s => s.status === 'Clocked In').length === 0 && (
            <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>No active staff</Text>
          )}

          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <View style={styles.sectionTitleRow}>
              <Icon name="account-off" size={18} color={COLORS.textSecondary} />
              <Text style={[styles.sectionTitle, { color: COLORS.textPrimary }]}>Offline</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: COLORS.containerGray }]}>
              <Text style={[styles.countBadgeText, { color: COLORS.textSecondary }]}>
                {filteredStaff.filter(s => s.status !== 'Clocked In').length}
              </Text>
            </View>
          </View>

          {filteredStaff.filter(s => s.status !== 'Clocked In').map(staff => (
            <StaffCard key={staff.id} staff={staff} />
          ))}

          {filteredStaff.filter(s => s.status !== 'Clocked In').length === 0 && (
            <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>No offline staff</Text>
          )}

        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 16,
    marginHorizontal: 20,
    marginTop: 10, // Reduced since SafeAreaView now handles the top spacing
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    paddingVertical: 14,
    paddingLeft: 44,
    paddingRight: 44,
    borderRadius: 16,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    backgroundColor: colors.white,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    zIndex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 28,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryIconContainer: {
    marginBottom: 8,
    opacity: 0.9,
  },
  summaryCardValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  summaryCardLabel: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    opacity: 0.95,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  staffCard: {
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 14,
  },
  staffLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  staffInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    marginVertical: 10,
  },
});

export default StaffScreen;