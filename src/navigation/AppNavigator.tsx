import React, { useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { View, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme as usePaperTheme } from 'react-native-paper';

// Auth screens
import AccountLoginScreen from '../screens/AccountLoginScreen';
import EstablishmentSelectorScreen from '../screens/EstablishmentSelectorScreen';

// Main app screens
import DashboardScreen from '../screens/DashboardScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProductManagementScreen from '../screens/ProductManagementScreen';
import StaffScreen from '../screens/StaffScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CustomersScreen from '../screens/CustomersScreen';
import AuditLogScreen from '../screens/AuditLogScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';

import ManufacturingInventoryScreen from '../screens/ManufacturingInventoryScreen';
import RecipeManagementScreen from '../screens/RecipeManagementScreen';
import SalesSettingsScreen from '../screens/SalesSettingsScreen';
import AttributesScreen from '../screens/AttributesScreen';

import { RootState, AppDispatch } from '../store/store';
import { checkAuthStatus } from '../store/slices/authSlice';
import { AppTheme } from '../theme/theme';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

import { useAppStateAuth } from '../hooks/useAppStateAuth';
import BackOfficeHeader from '../components/common/BackOfficeHeader';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const DrawerNavigator = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const theme = usePaperTheme() as unknown as AppTheme;
  const { currentEstablishment, account } = useSelector((state: RootState) => state.auth);

  return (
    <Drawer.Navigator
      initialRouteName="Reports"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        header: ({ navigation }) => {
          return (
            <BackOfficeHeader
              storeName={currentEstablishment?.name || "PayMint Store"}
              userName={account?.firstName || "Owner"}
              storeStatus="CLOSED"
              onMenuPress={() => navigation.toggleDrawer()}
              onNotificationsPress={() => navigation.navigate('Notifications')}
            />
          );
        },
        headerStyle: {
          backgroundColor: COLORS.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderLight,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          color: COLORS.textPrimary,
          fontSize: 18,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: COLORS.textSecondary,
        drawerActiveBackgroundColor: theme.colors.primary + '15',
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          marginLeft: 4,
        },
        drawerItemStyle: {
          borderRadius: 12,
          marginHorizontal: 10,
          paddingLeft: 4,
          marginVertical: 4,
        },
      }}
    >
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="chart-bar" size={22} color={color} />
          ),
          title: 'Reports & Analytics'
        }}
      />
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="view-dashboard-outline" size={22} color={color} />
          ),
          title: 'Dashboard'
        }}
      />
      <Drawer.Screen
        name="Products"
        component={ProductManagementScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="package-variant-closed" size={22} color={color} />
          ),
          title: 'Product Catalog'
        }}
      />
      <Drawer.Screen
        name="Attributes"
        component={AttributesScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="tag-multiple-outline" size={22} color={color} />
          ),
          title: 'Add-ons & Attributes'
        }}
      />
      <Drawer.Screen
        name="Staff"
        component={StaffScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="account-group-outline" size={22} color={color} />
          ),
          title: 'Staff Management'
        }}
      />
      <Drawer.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="account-heart-outline" size={22} color={color} />
          ),
          title: 'Customers & Loyalty'
        }}
      />

      <Drawer.Screen
        name="AuditLog"
        component={AuditLogScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="shield-check-outline" size={22} color={color} />
          ),
          title: 'Activity Logs'
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="alert-circle-outline" size={22} color={color} />
          ),
          title: 'Cash Alerts'
        }}
      />
      <Drawer.Screen
        name="Manufacturing"
        component={ManufacturingInventoryScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="barrel" size={22} color={color} />
          ),
          title: 'Raw Materials'
        }}
      />
      <Drawer.Screen
        name="Recipes"
        component={RecipeManagementScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="food-variant" size={22} color={color} />
          ),
          title: 'Recipe Management'
        }}
      />
      <Drawer.Screen
        name="SalesManagement"
        component={SalesSettingsScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="cash-register" size={22} color={color} />
          ),
          title: 'Sales Management'
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color }) => (
            <Icon name="cog-outline" size={22} color={color} />
          ),
          title: 'Settings'
        }}
      />
    </Drawer.Navigator >
  );
};

const AppNavigator = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, account, currentEstablishment, establishments } = useSelector(
    (state: RootState) => state.auth
  );

  // Handle app state changes for authentication
  useAppStateAuth();

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#7CC39F" />
      </View>
    );
  }

  // Determine which screen to show based on auth state
  // Flow: Not authenticated -> AccountLoginScreen
  //       Authenticated but no establishment selected (and multiple establishments) -> EstablishmentSelectorScreen
  //       Authenticated with establishment selected -> Main App
  const needsEstablishmentSelection = isAuthenticated && account && !currentEstablishment && establishments.length > 1;
  const hasNoEstablishments = isAuthenticated && account && establishments.length === 0;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated && currentEstablishment ? (
        // User is authenticated AND has selected an establishment -> Show main app
        <Stack.Screen name="Main" component={DrawerNavigator} />
      ) : isAuthenticated && account ? (
        // User is authenticated but needs to select an establishment
        // (or has no establishments - show selector with empty state)
        <>
          {(needsEstablishmentSelection || hasNoEstablishments) && (
            <Stack.Screen name="EstablishmentSelector" component={EstablishmentSelectorScreen} />
          )}
        </>
      ) : (
        // User is not authenticated -> Show login
        <Stack.Screen name="AccountLogin" component={AccountLoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
