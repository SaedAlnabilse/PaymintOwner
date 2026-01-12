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
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { apiClient } from '../services/apiClient';
import ConfirmationModal from '../components/common/ConfirmationModal';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  location?: string;
  locationId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastActive?: string;
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  MANAGER: { bg: '#F3E8FF', color: '#9333EA' },
  CASHIER: { bg: '#E3F2FD', color: '#1976D2' },
  WAITER: { bg: '#FEF3C7', color: '#D97706' },
  KITCHEN: { bg: '#FFEBEE', color: '#C62828' },
  DEFAULT: { bg: '#F5F5F5', color: '#757575' },
};

const BrandTeamScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const brandId = route.params?.brandId;

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, [brandId]);

  const fetchTeamMembers = async () => {
    try {
      if (!refreshing) setIsLoading(true);

      const response = await apiClient.get(`/api/brands/${brandId}/team`);

      if (response.data) {
        setBrandName(response.data.brandName || '');
        setTeamMembers(response.data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
      // Mock data
      setBrandName('Coffee House');
      setTeamMembers([
        {
          id: '1',
          firstName: 'Ahmad',
          lastName: 'Mohammad',
          email: 'ahmad@example.com',
          role: 'MANAGER',
          location: 'Downtown Branch',
          locationId: '1',
          status: 'ACTIVE',
          lastActive: new Date().toISOString(),
        },
        {
          id: '2',
          firstName: 'Sara',
          lastName: 'Ali',
          email: 'sara@example.com',
          role: 'CASHIER',
          location: 'Mall Branch',
          locationId: '2',
          status: 'ACTIVE',
          lastActive: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          firstName: 'Omar',
          lastName: 'Hassan',
          email: 'omar@example.com',
          role: 'WAITER',
          location: 'Downtown Branch',
          locationId: '1',
          status: 'ACTIVE',
          lastActive: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '4',
          firstName: 'Layla',
          lastName: 'Khalil',
          email: 'layla@example.com',
          role: 'KITCHEN',
          location: 'Airport Branch',
          locationId: '3',
          status: 'INACTIVE',
          lastActive: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeamMembers();
  }, [brandId]);

  const handleRemoveMember = (member: TeamMember) => {
    setRemoveTarget(member);
    setShowRemoveConfirm(true);
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    try {
      await apiClient.delete(`/api/brands/${brandId}/team/${removeTarget.id}`);
      setShowRemoveConfirm(false);
      setRemoveTarget(null);
      fetchTeamMembers();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to remove team member');
    }
  };

  const handleAddMember = () => {
    Alert.alert('Coming Soon', 'Add team member feature coming soon.');
  };

  const getRoleStyle = (role: string) => {
    return ROLE_COLORS[role] || ROLE_COLORS.DEFAULT;
  };

  const roles = [...new Set(teamMembers.map((m) => m.role))];

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      !searchQuery ||
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !selectedRole || member.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter((m) => m.status === 'ACTIVE').length,
    managers: teamMembers.filter((m) => m.role === 'MANAGER').length,
  };

  const renderMember = ({ item }: { item: TeamMember }) => {
    const roleStyle = getRoleStyle(item.role);
    const isActive = item.status === 'ACTIVE';

    return (
      <View style={[styles.memberCard, { backgroundColor: COLORS.cardBackground }]}>
        <View style={styles.memberHeader}>
          <View style={[styles.avatar, { backgroundColor: isActive ? '#7CC39F' : '#E2E8F0' }]}>
            <Text style={[styles.avatarText, { color: isActive ? '#000' : '#64748B' }]}>
              {item.firstName.charAt(0)}
              {item.lastName.charAt(0)}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={[styles.memberName, { color: COLORS.textPrimary }]}>
                {item.firstName} {item.lastName}
              </Text>
              {isActive && <View style={styles.onlineDot} />}
            </View>
            <Text style={[styles.memberEmail, { color: COLORS.textSecondary }]}>{item.email}</Text>
            <View style={styles.memberMeta}>
              <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                <Text style={[styles.roleText, { color: roleStyle.color }]}>{item.role}</Text>
              </View>
              {item.location && (
                <View style={styles.locationBadge}>
                  <Icon name="map-marker" size={12} color={COLORS.textSecondary} />
                  <Text style={[styles.locationText, { color: COLORS.textSecondary }]}>
                    {item.location}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.memberActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
            onPress={() => Alert.alert('Coming Soon', 'View member details coming soon.')}
          >
            <Icon name="eye" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
            onPress={() => Alert.alert('Coming Soon', 'Edit member coming soon.')}
          >
            <Icon name="pencil" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
            onPress={() => handleRemoveMember(item)}
          >
            <Icon name="account-remove" size={16} color="#DC2626" />
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
              <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Team</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
              <Icon name="account-plus" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="account-group" size={20} color="#1976D2" />
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
            <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
              <Icon name="shield-account" size={20} color="#9333EA" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Managers</Text>
            <Text style={[styles.statValue, { color: '#9333EA' }]}>{stats.managers}</Text>
          </View>
        </View>

        {/* Search & Filter */}
        <View style={[styles.searchContainer, { backgroundColor: COLORS.cardBackground }]}>
          <View style={[styles.searchInput, { backgroundColor: COLORS.backgroundSecondary }]}>
            <Icon name="magnify" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={[styles.searchTextInput, { color: COLORS.textPrimary }]}
              placeholder="Search team members..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Role Filters */}
        <View style={styles.roleFiltersContainer}>
          <TouchableOpacity
            style={[
              styles.roleFilter,
              !selectedRole && styles.roleFilterActive,
              { borderColor: !selectedRole ? '#7CC39F' : COLORS.border },
            ]}
            onPress={() => setSelectedRole(null)}
          >
            <Text style={[styles.roleFilterText, { color: !selectedRole ? '#7CC39F' : COLORS.textSecondary }]}>
              All
            </Text>
          </TouchableOpacity>
          {roles.map((role) => {
            const roleStyle = getRoleStyle(role);
            const isSelected = selectedRole === role;
            return (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleFilter,
                  isSelected && styles.roleFilterActive,
                  { borderColor: isSelected ? roleStyle.color : COLORS.border },
                ]}
                onPress={() => setSelectedRole(role)}
              >
                <Text
                  style={[
                    styles.roleFilterText,
                    { color: isSelected ? roleStyle.color : COLORS.textSecondary },
                  ]}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7CC39F" />
          </View>
        ) : filteredMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Icon name="account-off" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No team members</Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
              {searchQuery || selectedRole
                ? 'Try adjusting your search or filters.'
                : 'Add team members to manage your brand locations.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item.id}
            renderItem={renderMember}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />
            }
          />
        )}

        {/* Remove Confirmation */}
        <ConfirmationModal
          isVisible={showRemoveConfirm}
          title="Remove Team Member"
          message={`Are you sure you want to remove "${removeTarget?.firstName} ${removeTarget?.lastName}" from the team?`}
          confirmText="Remove"
          confirmColor="#DC2626"
          onConfirm={confirmRemove}
          onCancel={() => {
            setShowRemoveConfirm(false);
            setRemoveTarget(null);
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
    fontSize: 18,
    fontWeight: '800',
  },
  searchContainer: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    gap: 10,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  roleFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  roleFilter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  roleFilterActive: {
    backgroundColor: 'rgba(124, 195, 159, 0.1)',
  },
  roleFilterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  memberCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  memberEmail: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 8,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
  },
});

export default BrandTeamScreen;
