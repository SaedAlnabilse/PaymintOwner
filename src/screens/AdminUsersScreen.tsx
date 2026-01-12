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
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import ScreenContainer from '../components/common/ScreenContainer';
import { RootState } from '../store/store';
import { apiClient } from '../services/apiClient';
import ConfirmationModal from '../components/common/ConfirmationModal';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  permissions?: string[];
}

const AdminUsersScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const { account, establishments } = useSelector((state: RootState) => state.auth);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      if (!refreshing) setIsLoading(true);
      const response = await apiClient.get('/api/accounts/admin-users');
      setAdminUsers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      // Mock data for now
      setAdminUsers([
        {
          id: '1',
          email: account?.email || 'owner@example.com',
          firstName: account?.firstName || 'Owner',
          lastName: account?.lastName || 'Account',
          role: 'OWNER',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAdminUsers();
  }, []);

  const handleAddAdmin = async () => {
    if (!newEmail.trim() || !newFirstName.trim() || !newLastName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post('/api/accounts/admin-users', {
        email: newEmail.trim(),
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
      });
      setShowAddModal(false);
      setNewEmail('');
      setNewFirstName('');
      setNewLastName('');
      fetchAdminUsers();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add admin user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (user: AdminUser) => {
    if (user.role === 'OWNER') {
      Alert.alert('Cannot Delete', 'The account owner cannot be deleted.');
      return;
    }
    setDeleteTarget(user);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/api/accounts/admin-users/${deleteTarget.id}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchAdminUsers();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to delete admin user');
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { bg: '#F0FDF4', color: '#15803D', text: 'Owner' };
      case 'ADMIN':
        return { bg: '#F3E8FF', color: '#9333EA', text: 'Admin' };
      default:
        return { bg: '#F5F5F5', color: '#757575', text: role };
    }
  };

  const renderAdminUser = ({ item }: { item: AdminUser }) => {
    const roleStyle = getRoleStyle(item.role);
    const isOwner = item.role === 'OWNER';

    return (
      <View style={[styles.userCard, { backgroundColor: COLORS.cardBackground }]}>
        <View style={styles.userContent}>
          <View style={[styles.avatar, { backgroundColor: isOwner ? '#7CC39F' : '#E3F2FD' }]}>
            <Text style={[styles.avatarText, { color: isOwner ? '#000' : '#1976D2' }]}>
              {item.firstName?.charAt(0) || ''}
              {item.lastName?.charAt(0) || ''}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={[styles.userName, { color: COLORS.textPrimary }]}>
                {item.firstName} {item.lastName}
              </Text>
              {isOwner && <Icon name="crown" size={16} color="#7CC39F" />}
            </View>
            <Text style={[styles.userEmail, { color: COLORS.textSecondary }]}>{item.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
              <Text style={[styles.roleText, { color: roleStyle.color }]}>{roleStyle.text}</Text>
            </View>
          </View>
        </View>
        {!isOwner && (
          <View style={styles.userActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.backgroundSecondary }]}
              onPress={() => Alert.alert('Coming Soon', 'Edit admin permissions coming soon.')}
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
        )}
      </View>
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
                <Icon name="account-key" size={28} color="#000" />
              </View>
              <View>
                <Text style={[styles.title, { color: COLORS.textPrimary }]}>Admin Users</Text>
                <Text style={[styles.subtitle, { color: COLORS.textSecondary }]}>
                  Manage account access
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Icon name="plus" size={20} color="#000" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="account-group" size={20} color="#1976D2" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Total Admins</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{adminUsers.length}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
              <Icon name="store" size={20} color="#9333EA" />
            </View>
            <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>Establishments</Text>
            <Text style={[styles.statValue, { color: COLORS.textPrimary }]}>{establishments.length}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: '#FEF3C7' }]}>
          <Icon name="information-outline" size={20} color="#D97706" />
          <Text style={styles.infoText}>
            Admin users can access and manage your establishments based on their assigned permissions.
          </Text>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7CC39F" />
          </View>
        ) : adminUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.backgroundSecondary }]}>
              <Icon name="account-off" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No admin users</Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.textSecondary }]}>
              Add admin users to help manage your establishments.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyButtonText}>Add Admin User</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={adminUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderAdminUser}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7CC39F']} />
            }
          />
        )}

        {/* Add Admin Modal */}
        {showAddModal && (
          <View style={styles.modalOverlay}>
            <View style={[styles.modal, { backgroundColor: COLORS.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>Add Admin User</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Icon name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>First Name</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: COLORS.backgroundSecondary, color: COLORS.textPrimary }]}
                  value={newFirstName}
                  onChangeText={setNewFirstName}
                  placeholder="John"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Last Name</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: COLORS.backgroundSecondary, color: COLORS.textPrimary }]}
                  value={newLastName}
                  onChangeText={setNewLastName}
                  placeholder="Doe"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: COLORS.textSecondary }]}>Email</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: COLORS.backgroundSecondary, color: COLORS.textPrimary }]}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="john@example.com"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: COLORS.border }]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: COLORS.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleAddAdmin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.submitBtnText}>Add Admin</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Delete Confirmation */}
        <ConfirmationModal
          isVisible={showDeleteConfirm}
          title="Remove Admin User"
          message={`Are you sure you want to remove "${deleteTarget?.firstName} ${deleteTarget?.lastName}" from admin access?`}
          confirmText="Remove"
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userCard: {
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
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userActions: {
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#7CC39F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
});

export default AdminUsersScreen;
