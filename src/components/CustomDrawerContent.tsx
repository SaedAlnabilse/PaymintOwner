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
import { logoutUser } from '../store/slices/authSlice';
import LogoutModal from './common/LogoutModal';
import { AppTheme } from '../theme/theme';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { clearTenant } from '../store/slices/authSlice';

const InventoryIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcon name="package-variant" size={20} color={color} />
);

const CategoriesIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcon name="shape-outline" size={20} color={color} />
);

const ManufacturingIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcon name="barrel" size={20} color={color} />
);

const RecipesIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcon name="food-variant" size={20} color={color} />
);

const CustomDrawerContent = (props: any) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const theme = usePaperTheme() as unknown as AppTheme;
  const dispatch = useDispatch<AppDispatch>();
  const { user, selectedTenant } = useSelector((state: RootState) => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    dispatch(logoutUser());
  };

  const handleSwitchRestaurant = () => {
    dispatch(clearTenant());
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Filter out the items that we want to group manually
  const inventoryRoutes = ['Products', 'Manufacturing', 'Recipes'];

  // Calculate filtered routes and corresponding index
  let filteredRoutes = props.state.routes.filter(
    (route: any) => !inventoryRoutes.includes(route.name)
  );

  // Find the active route in the original list
  const activeRoute = props.state.routes[props.state.index];
  // Find where that route is in our filtered list (will be -1 if it's a grouped item)
  let filteredIndex = filteredRoutes.findIndex((r: any) => r.key === activeRoute?.key);
  let filteredDescriptors = props.descriptors;

  // If the active route is hidden (e.g. Products), we need to handle it to avoid crashes
  // in DrawerItemList (which expects state.routes[state.index] to exist) 
  // and to ensure no other item is highlighted.
  if (filteredIndex === -1 && activeRoute) {
    filteredRoutes = [...filteredRoutes, activeRoute];
    filteredIndex = filteredRoutes.length - 1;

    // Hide this item visually
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

  // Create split descriptors to show only relevant items in each section
  const firstPartDescriptors: any = {};
  const secondPartDescriptors: any = {};

  filteredRoutes.forEach((route: any, index: number) => {
    const descriptor = filteredDescriptors[route.key];
    if (index < 2) {
      // Visible in first part, hidden in second
      firstPartDescriptors[route.key] = descriptor;
      secondPartDescriptors[route.key] = {
        ...descriptor,
        options: { ...descriptor.options, drawerItemStyle: { display: 'none' } }
      };
    } else {
      // Hidden in first part, visible in second
      firstPartDescriptors[route.key] = {
        ...descriptor,
        options: { ...descriptor.options, drawerItemStyle: { display: 'none' } }
      };
      secondPartDescriptors[route.key] = descriptor;
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

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Brand Header */}
      <View style={[styles.header, { backgroundColor: COLORS.white, borderBottomColor: COLORS.borderLight }]}>
        <View style={styles.restaurantInfo}>
          <Text style={[styles.restaurantName, { color: COLORS.primary }]}>{selectedTenant?.name || 'PayMint Business'}</Text>
          <TouchableOpacity onPress={handleSwitchRestaurant} style={styles.switchLink}>
            <Text style={styles.switchLinkText}>Switch Restaurant</Text>
          </TouchableOpacity>
        </View>

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
          {/* First 2 items (e.g. Dashboard, Sales) */}
          <DrawerItemList {...sharedProps} descriptors={firstPartDescriptors} />

          {/* Custom Expandable Inventory Group (Position 3) */}
          <View style={styles.inventoryGroupContainer}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => setIsInventoryExpanded(!isInventoryExpanded)}
            >
              <View style={styles.groupHeaderContent}>
                <MaterialCommunityIcon name="package-variant-closed" size={22} color={isInventoryExpanded ? theme.colors.primary : COLORS.textSecondary} />
                <Text style={[
                  styles.groupHeaderText,
                  { color: isInventoryExpanded ? theme.colors.primary : COLORS.textSecondary }
                ]}>Inventory Management</Text>
              </View>
              <Icon name={isInventoryExpanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {isInventoryExpanded && (
              <View style={styles.subGroupContainer}>
                <DrawerItem
                  label="Product Catalog"
                  icon={InventoryIcon}
                  onPress={() => props.navigation.navigate('Products')}
                  focused={props.state.index === props.state.routes.findIndex((r: any) => r.name === 'Products')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Raw Materials"
                  icon={ManufacturingIcon}
                  onPress={() => props.navigation.navigate('Manufacturing')}
                  focused={props.state.index === props.state.routes.findIndex((r: any) => r.name === 'Manufacturing')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
                <DrawerItem
                  label="Recipe Management"
                  icon={RecipesIcon}
                  onPress={() => props.navigation.navigate('Recipes')}
                  focused={props.state.index === props.state.routes.findIndex((r: any) => r.name === 'Recipes')}
                  labelStyle={styles.subItemLabel}
                  style={styles.subItem}
                  activeTintColor={theme.colors.primary}
                  inactiveTintColor={COLORS.textSecondary}
                />
              </View>
            )}
          </View>

          {/* Rest of the items */}
          <DrawerItemList {...sharedProps} descriptors={secondPartDescriptors} />
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
  switchLink: {
    alignSelf: 'flex-start',
  },
  switchLinkText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
  inventoryGroupContainer: {
    marginTop: 4,
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
    borderLeftColor: '#F1F5F9',
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
    marginLeft: 4, // Removed negative margin and added positive to fix overlap
  },
});

export default CustomDrawerContent;
