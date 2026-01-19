import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { RootState, AppDispatch } from '../store/store';
import { logoutAccount } from '../store/slices/authSlice';
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
  const { account, currentEstablishment, establishments } = useSelector((state: RootState) => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Expandable menu states
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(false);
  const [isPeopleExpanded, setIsPeopleExpanded] = useState(false);
  const [isSystemExpanded, setIsSystemExpanded] = useState(false);
  const [isOwnerExpanded, setIsOwnerExpanded] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    dispatch(logoutAccount());
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Get display name from account
  const displayName = account ? `${account.firstName} ${account.lastName}` : 'Account Owner';
  const displayInitial = account?.firstName?.charAt(0).toUpperCase() || 'A';

  // Routes to hide from main drawer (grouped routes)
  const groupedRoutes = [
    'Products', 'Attributes', 'Manufacturing', 'Recipes', // Inventory
    'Staff', 'Customers', // People
    'Settings', 'AuditLog', 'Notifications', // System
    'OwnerOverview', 'OwnerEmployees', 'Brands', 'Establishments', 'AdminUsers' // Owner Portal
  ];

  // Calculate filtered routes
  let filteredRoutes = props.state.routes.filter(
    (route: any) => !groupedRoutes.includes(route.name)
  );

  const activeRoute = props.state.routes[props.state.index];
  let filteredIndex = filteredRoutes.findIndex((r: any) => r.key === activeRoute?.key);
  let filteredDescriptors = props.descriptors;

  if (filteredIndex === -1 && activeRoute) {
    filteredRoutes = [...filteredRoutes, activeRoute];
    filteredIndex = filteredRoutes.length - 1;
    filteredDescriptors = {
      ...props.descriptors,
      [activeRoute.key]: {
        ...props.descriptors[activeRoute.key],
        options: {
          ...props.descriptors[activeRoute.key].options,
          drawerItemStyle: { display: 'none' }
        }
      }
    };
  }

  // Split descriptors for proper rendering
  const dashboardDescriptors: any = {};
  const reportsDescriptors: any = {};
  const salesDescriptors: any = {};

  filteredRoutes.forEach((route: any, index: number) => {
    const descriptor = filteredDescriptors[route.key];
    if (route.name === 'Dashboard') {
      dashboardDescriptors[route.key] = descriptor;
      reportsDescriptors[route.key] = { ...descriptor, options: { ...descriptor.options, drawerItemStyle: { display: 'none' } } };
      salesDescriptors[route.key] = { ...descriptor, options: { ...descriptor.options, drawerItemStyle: { display: 'none' } } };
    } else if (route.name === 'Reports') {
      reportsDescriptors[route.key] = descriptor;
      dashboardDescriptors[route.key] = { ...descriptor, options: { ...descriptor.options, drawerItemStyle: { display: 'none' } } };
      salesDescriptors[route.key] = { ...descriptor, options: { ...descriptor.options, drawerItemStyle: { display: 'none' } } };
    } else if (route.name === 'SalesManagement') {
      salesDescriptors[route.key] = descriptor;
      dashboardDescriptors[route.key] = { ...descriptor, options: { ...descriptor.options, drawerItemStyle: { display: 'none' } } };
      reportsDescriptors[route.key] = { ...descriptor, options: { ...descriptor.options, drawerItemStyle: { display: 'none' } } };
    } else {
      // Hide extra items
      dashboardDescriptors[route.key] = { ...descriptor, options: { ...descriptor.options, drawerItemStyle: { display: 'none' } } };
      reportsDescriptors[route.key] = { ...descriptor, options: { ...descriptor.options, drawerItemStyle: { display: 'none' } } };
      salesDescriptors[route.key] = { ...descriptor, options: { ...descriptor.options, drawerItemStyle: { display: 'none' } } };
    }
  });

  const sharedProps = {
    ...props,
    state: {
      ...props.state,
      routes: filteredRoutes,
      index: filteredIndex,
    },
  };

  const isRouteActive = (routeName: string) => {
    return props.state.index === props.state.routes.findIndex((r: any) => r.name === routeName);
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Brand Header */}
      <View style={[styles.header, { backgroundColor: COLORS.white, borderBottomColor: COLORS.borderLight }]}>
        <View style={styles.restaurantInfo}>
          <Text style={[styles.restaurantName, { color: COLORS.primary }]}>{currentEstablishment?.name || 'PayMint Business'}</Text>
          {establishments.length > 1 && (
            <Text style={styles.switchLinkText}>
              {establishments.length} establishments
            </Text>
          )}
        </View>

        <View style={styles.profileSection}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
              {displayInitial}
            </Text>
            <View style={[styles.onlineBadge, { backgroundColor: COLORS.success, borderColor: COLORS.white }]} />
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: COLORS.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={[styles.userRole, { color: COLORS.textSecondary }]}>
                {account?.email || 'Owner'}
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
          {/* Dashboard */}
          <DrawerItemList {...sharedProps} descriptors={dashboardDescriptors} />

          {/* Reports */}
          <DrawerItemList {...sharedProps} descriptors={reportsDescriptors} />

          {/* Inventory Group */}
          <View style={styles.groupContainer}>
            <TouchableOpacity
              style={[
                styles.groupHeader,
                isInventoryExpanded && { backgroundColor: theme.colors.primary + '05' }
              ]}
              onPress={() => setIsInventoryExpanded(!isInventoryExpanded)}
            >
              <View style={styles.groupHeaderContent}>
                <MaterialCommunityIcon
                  name="package-variant-closed"
                  size={22}
                  color={isInventoryExpanded ? theme.colors.primary : COLORS.textSecondary}
                />
                <Text style={[
                  styles.groupHeaderText,
                  { color: isInventoryExpanded ? theme.colors.primary : COLORS.textSecondary }
                ]}>Inventory</Text>
              </View>
              <Icon name={isInventoryExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {isInventoryExpanded && (
              <View style={[styles.subGroupContainer, { borderLeftColor: theme.colors.primary + '20' }]}>
                <DrawerItem
                  label="Product Catalog"
                  icon={({ color }) => <MaterialCommunityIcon name="package-variant" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('Products')}
                  focused={isRouteActive('Products')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Add-ons & Attributes"
                  icon={({ color }) => <MaterialCommunityIcon name="tag-multiple-outline" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('Attributes')}
                  focused={isRouteActive('Attributes')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Raw Materials"
                  icon={({ color }) => <MaterialCommunityIcon name="barrel" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('Manufacturing')}
                  focused={isRouteActive('Manufacturing')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Recipe Management"
                  icon={({ color }) => <MaterialCommunityIcon name="food-variant" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('Recipes')}
                  focused={isRouteActive('Recipes')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
              </View>
            )}
          </View>

          {/* People Group */}
          <View style={styles.groupContainer}>
            <TouchableOpacity
              style={[
                styles.groupHeader,
                isPeopleExpanded && { backgroundColor: theme.colors.primary + '05' }
              ]}
              onPress={() => setIsPeopleExpanded(!isPeopleExpanded)}
            >
              <View style={styles.groupHeaderContent}>
                <MaterialCommunityIcon
                  name="account-group-outline"
                  size={22}
                  color={isPeopleExpanded ? theme.colors.primary : COLORS.textSecondary}
                />
                <Text style={[
                  styles.groupHeaderText,
                  { color: isPeopleExpanded ? theme.colors.primary : COLORS.textSecondary }
                ]}>People</Text>
              </View>
              <Icon name={isPeopleExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {isPeopleExpanded && (
              <View style={[styles.subGroupContainer, { borderLeftColor: theme.colors.primary + '20' }]}>
                <DrawerItem
                  label="Staff Management"
                  icon={({ color }) => <MaterialCommunityIcon name="account-group" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('Staff')}
                  focused={isRouteActive('Staff')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Customers & Loyalty"
                  icon={({ color }) => <MaterialCommunityIcon name="account-heart-outline" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('Customers')}
                  focused={isRouteActive('Customers')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
              </View>
            )}
          </View>

          {/* Sales Settings */}
          <DrawerItemList {...sharedProps} descriptors={salesDescriptors} />

          {/* System Group */}
          <View style={styles.groupContainer}>
            <TouchableOpacity
              style={[
                styles.groupHeader,
                isSystemExpanded && { backgroundColor: theme.colors.primary + '05' }
              ]}
              onPress={() => setIsSystemExpanded(!isSystemExpanded)}
            >
              <View style={styles.groupHeaderContent}>
                <MaterialCommunityIcon
                  name="cog-outline"
                  size={22}
                  color={isSystemExpanded ? theme.colors.primary : COLORS.textSecondary}
                />
                <Text style={[
                  styles.groupHeaderText,
                  { color: isSystemExpanded ? theme.colors.primary : COLORS.textSecondary }
                ]}>System</Text>
              </View>
              <Icon name={isSystemExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {isSystemExpanded && (
              <View style={[styles.subGroupContainer, { borderLeftColor: theme.colors.primary + '20' }]}>
                <DrawerItem
                  label="Settings"
                  icon={({ color }) => <MaterialCommunityIcon name="cog" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('Settings')}
                  focused={isRouteActive('Settings')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Activity Logs"
                  icon={({ color }) => <MaterialCommunityIcon name="shield-check-outline" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('AuditLog')}
                  focused={isRouteActive('AuditLog')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Cash Alerts"
                  icon={({ color }) => <MaterialCommunityIcon name="alert-circle-outline" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('Notifications')}
                  focused={isRouteActive('Notifications')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
              </View>
            )}
          </View>

          {/* Owner Portal Group */}
          <View style={styles.groupContainer}>
            <TouchableOpacity
              style={[
                styles.groupHeader,
                isOwnerExpanded && { backgroundColor: theme.colors.primary + '05' }
              ]}
              onPress={() => setIsOwnerExpanded(!isOwnerExpanded)}
            >
              <View style={styles.groupHeaderContent}>
                <MaterialCommunityIcon
                  name="crown-outline"
                  size={22}
                  color={isOwnerExpanded ? theme.colors.primary : COLORS.textSecondary}
                />
                <Text style={[
                  styles.groupHeaderText,
                  { color: isOwnerExpanded ? theme.colors.primary : COLORS.textSecondary }
                ]}>Owner Portal</Text>
              </View>
              <Icon name={isOwnerExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {isOwnerExpanded && (
              <View style={[styles.subGroupContainer, { borderLeftColor: theme.colors.primary + '20' }]}>
                <DrawerItem
                  label="Owner Overview"
                  icon={({ color }) => <MaterialCommunityIcon name="view-dashboard" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('OwnerOverview')}
                  focused={isRouteActive('OwnerOverview')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Global Workforce"
                  icon={({ color }) => <MaterialCommunityIcon name="account-multiple-check" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('OwnerEmployees')}
                  focused={isRouteActive('OwnerEmployees')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Establishments"
                  icon={({ color }) => <MaterialCommunityIcon name="store-outline" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('Establishments')}
                  focused={isRouteActive('Establishments')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Brands"
                  icon={({ color }) => <MaterialCommunityIcon name="tag-heart" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('Brands')}
                  focused={isRouteActive('Brands')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Admin Users"
                  icon={({ color }) => <MaterialCommunityIcon name="account-key" size={20} color={color} />}
                  onPress={() => props.navigation.navigate('AdminUsers')}
                  focused={isRouteActive('AdminUsers')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
              </View>
            )}
          </View>
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

const createStyles = (_colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  restaurantInfo: {
    marginBottom: 20,
    gap: 4,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  switchLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
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
  groupContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 12,
  },
  groupHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 20,
  },
  subGroupContainer: {
    paddingLeft: 16,
    borderLeftWidth: 2,
    marginLeft: 28,
    marginBottom: 8,
  },
  subItem: {
    borderRadius: 8,
    marginVertical: 2,
    height: 48,
  },
  subItemLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default CustomDrawerContent;
