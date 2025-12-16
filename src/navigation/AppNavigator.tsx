import React, { useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { View, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme as usePaperTheme } from 'react-native-paper';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ReportsScreen from '../screens/ReportsScreen';
import InventoryScreen from '../screens/InventoryScreen';
import StaffScreen from '../screens/StaffScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CustomersScreen from '../screens/CustomersScreen';
import PromotionsScreen from '../screens/PromotionsScreen';
import AuditLogScreen from '../screens/AuditLogScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';

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

  return (
    <Drawer.Navigator
      initialRouteName="Reports"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        header: ({ navigation }) => {
          // You might need to fetch data like store name or notifications here or pass them down
          // For now using default placeholders or what's available
          return (
            <BackOfficeHeader
              storeName="Paymint Store"
              userName="Owner" // Ideally fetched from state
              storeStatus="CLOSED" // Ideally fetched from state
              onMenuPress={() => navigation.toggleDrawer()} // Toggle Drawer
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
          drawerIcon: ({ color, size }) => (
            <Icon name="chart-bar" size={22} color={color} />
          ),
          title: 'Reports & Analytics'
        }}
      />
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="view-dashboard-outline" size={22} color={color} />
          ),
          title: 'Dashboard'
        }}
      />
      <Drawer.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="package-variant-closed" size={22} color={color} />
          ),
          title: 'Inventory Command'
        }}
      />
      <Drawer.Screen
        name="Staff"
        component={StaffScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="account-group-outline" size={22} color={color} />
          ),
          title: 'Staff Management'
        }}
      />
      <Drawer.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="account-heart-outline" size={22} color={color} />
          ),
          title: 'Customers & Loyalty'
        }}
      />
      <Drawer.Screen
        name="Discounts"
        component={PromotionsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="tag-outline" size={22} color={color} />
          ),
          title: 'Discounts'
        }}
      />
      <Drawer.Screen
        name="AuditLog"
        component={AuditLogScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="shield-check-outline" size={22} color={color} />
          ),
          title: 'Activity Logs'
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Icon name="alert-circle-outline" size={22} color={color} />
          ),
          title: 'Cash Alerts'
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
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
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

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

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={DrawerNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
