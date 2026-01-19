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
import ReceiptSettingsModal from '../components/settings/ReceiptSettingsModal';
import LoyaltySettingsModal from '../components/settings/LoyaltySettingsModal';
import SalesSettingsModal from '../components/settings/SalesSettingsModal';
import DangerZoneModal from '../components/settings/DangerZoneModal';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  hasSwitch?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
  styles: any;
  colors: any;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  hasSwitch,
  value,
  onValueChange,
  onPress,
  iconColor,
  iconBg,
  badge,
  styles,
  colors
}) => (
  <TouchableOpacity
    style={[styles.item, { backgroundColor: colors.white }]}
    onPress={onPress}
    disabled={hasSwitch}
    activeOpacity={0.7}
  >
    <View style={styles.itemLeft}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg || colors.containerGray }]}>
        <Icon name={icon} size={24} color={iconColor || colors.primary} />
      </View>
      <View style={styles.itemTextContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{title}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: colors.errorBg }]}>
              <Text style={[styles.badgeText, { color: colors.errorText }]}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
    </View>
    {hasSwitch ? (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFF"
        ios_backgroundColor={colors.border}
      />
    ) : (
      <Icon name="chevron-right" size={22} color={colors.textTertiary} />
    )}
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const { isDarkMode, themeMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();

  const { notificationsEnabled } = useSelector((state: RootState) => state.notifications);

  const [restaurantName, setRestaurantName] = useState('Loading...');
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [showStoreProfile, setShowStoreProfile] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showReceiptSettings, setShowReceiptSettings] = useState(false);
  const [showLoyaltySettings, setShowLoyaltySettings] = useState(false);
  const [showSalesSettings, setShowSalesSettings] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getAppSettings();
      setSettings(data);
      setRestaurantName(data.restaurantName || 'My Restaurant');
    } catch (error) {
      console.error('Failed to load settings:', error);
      setRestaurantName('My Restaurant');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [fetchSettings])
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

  return (
    <ScreenContainer style={styles.screenContainer}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Settings</Text>
          <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>
            Manage Your Store Preferences
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
              styles={styles}
              colors={COLORS}
            />
            <SettingItem
              icon="receipt"
              title="Receipt Customization"
              subtitle="Logo, Header & Footer"
              iconColor={COLORS.primary}
              iconBg={COLORS.containerGray}
              onPress={() => setShowReceiptSettings(true)}
              styles={styles}
              colors={COLORS}
            />
          </View>
        </View>

        {/* Business Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Icon name="briefcase" size={18} color={COLORS.success} />
            <Text style={[styles.sectionHeader, { color: COLORS.textPrimary }]}>Business</Text>
          </View>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="star-circle-outline"
              title="Loyalty Program"
              subtitle="Points & Rewards"
              iconColor={COLORS.warning}
              iconBg={COLORS.containerGray}
              onPress={() => setShowLoyaltySettings(true)}
              styles={styles}
              colors={COLORS}
            />
            <SettingItem
              icon="cash-register"
              title="Sales Settings"
              subtitle="Tax Rate & Currency"
              iconColor={COLORS.success}
              iconBg={COLORS.containerGray}
              onPress={() => setShowSalesSettings(true)}
              styles={styles}
              colors={COLORS}
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
              styles={styles}
              colors={COLORS}
            />
            <SettingItem
              icon="theme-light-dark"
              title="Appearance"
              subtitle={getThemeLabel()}
              iconColor={isDarkMode ? COLORS.warning : COLORS.textSecondary}
              iconBg={COLORS.containerGray}
              onPress={() => setShowAppearance(true)}
              styles={styles}
              colors={COLORS}
            />
            <SettingItem
              icon="translate"
              title="Language"
              subtitle="English (US)"
              iconColor={COLORS.neutralGray}
              iconBg={COLORS.containerGray}
              styles={styles}
              colors={COLORS}
            />
          </View>
        </View>

        {/* Account section removed - logout available via drawer menu */}

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Icon name="alert-octagon" size={18} color={COLORS.error} />
            <Text style={[styles.sectionHeader, { color: COLORS.textPrimary }]}>Danger Zone</Text>
          </View>
          <View style={[styles.sectionContent, { borderColor: COLORS.error + '30' }]}>
            <SettingItem
              icon="delete-forever"
              title="Delete Establishment"
              subtitle="Permanently delete all data"
              iconColor={COLORS.error}
              iconBg={COLORS.errorBg}
              onPress={() => setShowDangerZone(true)}
              styles={styles}
              colors={COLORS}
            />
          </View>
        </View>

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

      <ReceiptSettingsModal
        visible={showReceiptSettings}
        onClose={() => setShowReceiptSettings(false)}
        settings={settings}
        onUpdate={fetchSettings}
      />

      <LoyaltySettingsModal
        visible={showLoyaltySettings}
        onClose={() => setShowLoyaltySettings(false)}
        currency={settings?.currency || '$'}
        onUpdate={fetchSettings}
      />

      <SalesSettingsModal
        visible={showSalesSettings}
        onClose={() => setShowSalesSettings(false)}
        onUpdate={fetchSettings}
      />

      <DangerZoneModal
        visible={showDangerZone}
        onClose={() => setShowDangerZone(false)}
        restaurantName={restaurantName}
      />

    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  screenContainer: {
    backgroundColor: colors.background,
  },
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
