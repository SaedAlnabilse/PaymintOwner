import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { RootState, AppDispatch } from '../store/store';
import { logoutUser } from '../store/slices/authSlice';
import LogoutModal from './common/LogoutModal';
import { AppTheme } from '../theme/theme';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const CustomDrawerContent = (props: any) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const theme = usePaperTheme() as unknown as AppTheme;
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    dispatch(logoutUser());
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Brand Header */}
      <View style={[styles.header, { backgroundColor: COLORS.white, borderBottomColor: COLORS.borderLight }]}>
        <View style={styles.profileSection}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </Text>
            <View style={[styles.onlineBadge, { backgroundColor: COLORS.success, borderColor: COLORS.white }]} />
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: COLORS.textPrimary }]} numberOfLines={1}>
              {user?.name || 'Admin User'}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={[styles.userRole, { color: COLORS.textSecondary }]}>
                {user?.role || 'Administrator'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Navigation Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: COLORS.white, borderTopColor: COLORS.borderLight }]}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: COLORS.errorBg }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Icon name="log-out" size={18} color={COLORS.error} />
          <Text style={[styles.logoutText, { color: COLORS.error }]}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={[styles.appName, { color: COLORS.textSecondary }]}>PayMint Owner</Text>
          <Text style={[styles.versionText, { color: COLORS.textTertiary }]}>v1.2.0</Text>
        </View>
      </View>

      {/* Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onCancel={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
  },
  userRole: {
    fontSize: 13,
    fontWeight: '500',
  },
  drawerContent: {
    paddingTop: 16,
  },
  menuContainer: {
    paddingHorizontal: 12,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
  versionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CustomDrawerContent;
