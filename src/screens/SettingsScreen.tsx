import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, Switch, PermissionsAndroid, Platform, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { ScreenContainer } from '../components/ScreenContainer';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
// logoutUser removed - logout available via drawer menu
import { getAppSettings, AppSettings } from '../services/settings';
import { AppDispatch, RootState } from '../store/store';
import { setNotificationsEnabled } from '../store/slices/notificationsSlice';
import StoreProfileModal from '../components/settings/StoreProfileModal';
import AppearanceModal from '../components/settings/AppearanceModal';

const SettingsScreen = () => {
  const { isDarkMode, themeMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const dispatch = useDispatch<AppDispatch>();
  
  const { notificationsEnabled } = useSelector((state: RootState) => state.notifications);

  const [restaurantName, setRestaurantName] = useState('Loading...');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [showStoreProfile, setShowStoreProfile] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchSettings = async () => {
        try {
          const data = await getAppSettings();
          setSettings(data);
          setRestaurantName(data.restaurantName || 'My Restaurant');
        } catch (error) {
          console.error('Failed to load settings:', error);
          setRestaurantName('My Restaurant');
        }
      };
      fetchSettings();
    }, [])
  );

  const handleNotificationsToggle = async (value: boolean) => {
    // TODO: Temporarily disabled as per user request
    /*
    if (value) {
      // Request permission when turning on
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            dispatch(setNotificationsEnabled(true));
          } else {
             Alert.alert(
              'Permission Denied',
              'Push notifications are disabled. Please enable them in settings to receive updates.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() }
              ]
            );
             dispatch(setNotificationsEnabled(false));
          }
        } catch (err) {
          console.warn(err);
          dispatch(setNotificationsEnabled(false));
        }
      } else {
        // For older Android or iOS (simulated/handled by OS), just enable
        dispatch(setNotificationsEnabled(true));
      }
    } else {
      dispatch(setNotificationsEnabled(false));
    }
    */
    // Force disable for now
    dispatch(setNotificationsEnabled(false));
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'auto': return 'System Default';
      default: return 'System Default';
    }
  };

  const SettingItem = ({ icon, title, subtitle, hasSwitch, value, onValueChange, onPress, iconColor, iconBg, badge }: any) => (
    <TouchableOpacity 
      style={[styles.item, { backgroundColor: COLORS.white }]} 
      onPress={onPress} 
      disabled={hasSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg || COLORS.containerGray }]}>
          <Icon name={icon} size={24} color={iconColor || COLORS.primary} />
        </View>
        <View style={styles.itemTextContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.itemTitle, { color: COLORS.textPrimary }]}>{title}</Text>
            {badge && (
              <View style={[styles.badge, { backgroundColor: COLORS.errorBg }]}>
                <Text style={[styles.badgeText, { color: COLORS.errorText }]}>{badge}</Text>
              </View>
            )}
          </View>
          {subtitle && <Text style={[styles.itemSubtitle, { color: COLORS.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {hasSwitch ? (
        <Switch 
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor="#FFF"
          ios_backgroundColor={COLORS.border}
        />
      ) : (
        <Icon name="chevron-right" size={22} color={COLORS.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>
            Manage your store preferences
          </Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* General Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Icon name="cog" size={18} color={COLORS.primary} />
            <Text style={[styles.sectionHeader, { color: COLORS.textPrimary }]}>General</Text>
          </View>
          <View style={styles.sectionContent}>
            <SettingItem 
              icon="store" 
              title="Store Profile" 
              subtitle={restaurantName}
              iconColor={COLORS.graphGray}
              iconBg={COLORS.containerGray}
              onPress={() => setShowStoreProfile(true)}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Icon name="tune" size={18} color={COLORS.orange} />
            <Text style={[styles.sectionHeader, { color: COLORS.textPrimary }]}>Preferences</Text>
          </View>
          <View style={styles.sectionContent}>
            <SettingItem 
              icon="bell-outline" 
              title="Push Notifications" 
              subtitle={notificationsEnabled ? "On" : "Off"}
              hasSwitch 
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              iconColor={COLORS.warning}
              iconBg={COLORS.containerGray}
            />
            <SettingItem 
              icon="theme-light-dark" 
              title="Appearance" 
              subtitle={getThemeLabel()}
              iconColor={isDarkMode ? COLORS.warning : COLORS.textSecondary}
              iconBg={COLORS.containerGray}
              onPress={() => setShowAppearance(true)}
            />
            <SettingItem 
              icon="translate" 
              title="Language" 
              subtitle="English (US)" 
              iconColor={COLORS.neutralGray}
              iconBg={COLORS.containerGray}
            />
          </View>
        </View>

        {/* Account section removed - logout available via drawer menu */}
        
        <View style={styles.versionContainer}>
          <Text style={[styles.version, { color: COLORS.textTertiary }]}>Version 1.0.0</Text>
          <Text style={[styles.buildNumber, { color: COLORS.textTertiary }]}>Build 45</Text>
        </View>
      </ScrollView>

      <StoreProfileModal 
        visible={showStoreProfile}
        onClose={() => setShowStoreProfile(false)}
        settings={settings}
      />

      <AppearanceModal 
        visible={showAppearance}
        onClose={() => setShowAppearance(false)}
      />

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
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionContent: {
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  itemSubtitle: {
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  version: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buildNumber: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SettingsScreen;
