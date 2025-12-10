import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { useNavigation } from '@react-navigation/native';
import {
  fetchNotifications,
  fetchUnreadCount,
  fetchCashAlerts,
  fetchCashAlertUnreadCount,
  markNotificationAsRead,
  markAllCashAlertsAsRead,
  deleteNotification,
} from '../store/slices/notificationsSlice';
import { ScreenContainer } from '../components/ScreenContainer';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { pushNotificationService } from '../services/pushNotificationService';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isNew?: boolean;
  stockNotification?: any;
  pinned?: boolean;
}

interface SwipeableNotificationProps {
  notification: NotificationItem;
  onDelete: (id: string) => void;
  onPress?: () => void;
  isPasswordReset?: boolean;
  styles: any;
}

const SwipeableNotification: React.FC<SwipeableNotificationProps> = ({
  notification,
  onDelete,
  onPress,
  isPasswordReset = false,
  styles,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [, setIsDragging] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
    },
    onPanResponderGrant: () => {
      setIsDragging(true);
      setShowDelete(true);
    },
    onPanResponderMove: (_, gestureState) => {
      // Only allow left swipe (negative values)
      if (gestureState.dx < 0) {
        translateX.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      setIsDragging(false);

      if (gestureState.dx < -100) {
        // Delete if swiped more than 100px
        Animated.timing(translateX, {
          toValue: -Dimensions.get('window').width,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onDelete(notification.id);
        });
      } else {
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start(() => {
          setShowDelete(false);
        });
      }
    },
  });

  return (
    <View style={styles.swipeableContainer}>
      {/* Delete background - only show when swiping */}
      {showDelete && (
        <View style={styles.deleteBackground}>
          <Text style={styles.deleteText}>Delete</Text>
        </View>
      )}

      {/* Notification card */}
      <Animated.View
        style={[
          styles.swipeableCard,
          styles.swipeableCardBorder,
          isPasswordReset && styles.passwordResetCard,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.swipeableContent,
            isPasswordReset && styles.passwordResetBackground,
          ]}
          onPress={onPress}
          activeOpacity={onPress ? 0.7 : 1}
        >
          <View style={styles.pinnedNotificationHeader}>
            <View style={styles.pinnedTitleRow}>
              <Text style={[
                styles.notificationTitle,
                styles.swipeableTitle,
                styles.pinnedTitleText,
                isPasswordReset && styles.passwordResetTitle,
              ]}>
                {notification.title}
              </Text>
            </View>
            <Text style={[
              styles.notificationTime,
              styles.swipeableTime,
              styles.pinnedTimeTop,
              isPasswordReset && styles.passwordResetTime,
            ]}>
              {notification.time}
            </Text>
          </View>
          <Text style={[
            styles.notificationMessage,
            styles.swipeableMessage,
            isPasswordReset && styles.passwordResetMessage,
          ]}>
            {notification.message}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const NotificationsScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const stockNotifications = useSelector(
    (state: RootState) => state.notifications.notifications,
  );
  const systemUpdate = useSelector((state: RootState) => state.notifications.systemUpdate);
  const [refreshing, setRefreshing] = useState(false);

  // Clear badge when user enters the notification page
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('📭 User entered notifications page, marking cash alerts as read...');

      // Mark all cash alerts as read in one API call
      try {
        await dispatch(markAllCashAlertsAsRead()).unwrap();
        console.log('✅ All cash alerts marked as read');
      } catch (error) {
        console.error('Failed to mark cash alerts as read:', error);
      }

      // Reload notifications to recalculate unread count
      await loadNotifications();
    });

    return unsubscribe;
  }, [navigation, dispatch, loadNotifications]);

  const loadNotifications = useCallback(async () => {
    try {
      // Fetch cash alerts from dedicated endpoint for better performance
      const cashAlertsResult = await dispatch(fetchCashAlerts({})).unwrap();
      console.log('💰 Cash Alerts loaded:', cashAlertsResult.notifications?.length || 0);

      // Also fetch regular notifications
      const result = await dispatch(fetchNotifications({})).unwrap();
      console.log('✅ All notifications loaded:', result.notifications?.length || 0);

      // Fetch the latest unread counts
      await Promise.all([
        dispatch(fetchUnreadCount()).unwrap(),
        dispatch(fetchCashAlertUnreadCount()).unwrap(),
      ]);

    } catch (error) {
      console.error('❌ Failed to load notifications:', error);
    }
  }, [dispatch]);

  // Track previous cash alerts to detect new ones
  const [previousCashAlertIds, setPreviousCashAlertIds] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize push notifications on mount
  useEffect(() => {
    const initNotifications = async () => {
      await pushNotificationService.configure();
      const granted = await pushNotificationService.requestPermissions();
      if (granted) {
        console.log('✅ Push notification permissions granted');
      } else {
        console.log('❌ Push notification permissions denied');
      }
      setIsInitialized(true);
    };
    initNotifications();
  }, []);

  useEffect(() => {
    loadNotifications();

    // Poll for new notifications every 15 seconds (optimized to reduce API calls)
    // Push notifications handle real-time alerts, polling is just for sync
    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Detect new cash alerts and trigger push notifications
  useEffect(() => {
    if (!isInitialized) {
      console.log('⏳ Waiting for notification service to initialize...');
      return;
    }

    const currentCashAlerts = stockNotifications.filter(n => n.type === 'CASH_ALERT');
    const currentIds = new Set(currentCashAlerts.map(n => n.id));

    console.log('� Current caash alerts:', currentCashAlerts.length);
    console.log('📊 Previous cash alert IDs:', previousCashAlertIds.size);

    // Skip the first load to avoid notifying about existing alerts
    if (previousCashAlertIds.size === 0 && currentCashAlerts.length > 0) {
      console.log('🔄 First load - setting baseline, not sending notifications');
      setPreviousCashAlertIds(currentIds);
      return;
    }

    // Find new alerts that weren't in the previous set
    const newAlerts = currentCashAlerts.filter(alert => !previousCashAlertIds.has(alert.id));

    if (newAlerts.length > 0) {
      console.log('🔔 New cash alerts detected:', newAlerts.length);
      newAlerts.forEach(alert => {
        console.log('📢 Sending push notification for:', alert.title);
        pushNotificationService.showCashAlert(
          alert.title,
          alert.message,
          { notificationId: alert.id, type: 'CASH_ALERT' }
        );
      });
    }

    // Update the previous IDs set
    setPreviousCashAlertIds(currentIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockNotifications, isInitialized]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleStockNotificationPress = useCallback(
    async (notification: any) => {
      if (!notification.isRead) {
        await dispatch(markNotificationAsRead(notification.id));
      }
      // Just mark as read
      console.log('Stock notification pressed:', notification);
    },
    [dispatch],
  );

  const handleClearAllNotifications = async () => {
    // Clear all regular (non-pinned) notifications
    const deletePromises = regularNotifications.map(notif =>
      dispatch(deleteNotification(notif.id)).unwrap(),
    );

    try {
      await Promise.all(deletePromises);
      console.log('✅ All regular notifications cleared');
      // Refresh the notifications list to ensure UI is updated
      await loadNotifications();
      // Clear the badge count as well
      await dispatch(fetchUnreadCount()).unwrap();
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await dispatch(deleteNotification(id)).unwrap();
      console.log('✅ Notification deleted:', id);
      // Refresh the notifications list to ensure UI is updated
      await loadNotifications();
      // Update the badge count
      await dispatch(fetchUnreadCount()).unwrap();
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  };

  const handleUpdatePress = () => {
    if (systemUpdate?.url) {
      import('react-native').then(({ Linking }) => {
        Linking.openURL(systemUpdate.url).catch(err =>
          console.error("Couldn't load page", err)
        );
      });
    }
  };

  // Separate critical stock notifications (pinned) from regular notifications
  const criticalStockNotifications: NotificationItem[] = stockNotifications
    .filter(notif =>
      notif.type === 'STOCK_ALERT_RED' ||
      notif.type === 'STOCK_ALERT_YELLOW' ||
      notif.type === 'OUT_OF_STOCK' ||
      (notif.item && notif.item.availableStock === 0)
    )
    .map(notif => ({
      id: notif.id,
      title: notif.title,
      message:
        notif.message +
        (notif.item
          ? ` (${notif.item.availableStock === 0
            ? 'Out of stock'
            : `${notif.item.availableStock} units left`
          })`
          : ''),
      time: new Date(notif.createdAt).toLocaleString(),
      isNew: !notif.isRead,
      stockNotification: notif,
      pinned: true,
    }));

  // Cash Alert Notifications (separate section for admin visibility)
  const cashAlertNotifications: NotificationItem[] = stockNotifications
    .filter(notif => notif.type === 'CASH_ALERT')
    .map(notif => ({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      time: new Date(notif.createdAt).toLocaleString(),
      isNew: !notif.isRead,
      stockNotification: notif,
      pinned: true,
    }));

  const regularNotifications: NotificationItem[] = stockNotifications
    .filter(notif =>
      notif.type !== 'STOCK_ALERT_RED' &&
      notif.type !== 'STOCK_ALERT_YELLOW' &&
      notif.type !== 'OUT_OF_STOCK' &&
      notif.type !== 'PASSWORD_RESET' &&
      notif.type !== 'CASH_ALERT' &&
      // HELD_ORDER removed from exclusion so they show in regular list
      !(notif.item && notif.item.availableStock === 0) &&
      !notif.title.includes('Replenishment') &&
      !notif.message.includes('replenished')
    )
    .map(notif => ({
      id: notif.id,
      title: notif.title,
      message:
        notif.message +
        (notif.item
          ? ` (${notif.item.availableStock === 0
            ? 'Out of stock'
            : `${notif.item.availableStock} units left`
          })`
          : ''),
      time: new Date(notif.createdAt).toLocaleString(),
      isNew: !notif.isRead,
      stockNotification: notif,
      pinned: false,
    }));

  // Get current unread count from store
  const storeUnreadCount = useSelector((state: RootState) => state.notifications.unreadCount);

  // If there's a mismatch between actual notifications and badge count, fix it
  React.useEffect(() => {
    const totalNotifications = cashAlertNotifications.length;

    if (storeUnreadCount > 0 && totalNotifications === 0) {
      console.log('🔄 Badge shows count but no notifications exist, clearing badge...');
      // Force refresh the unread count from server
      dispatch(fetchUnreadCount());
    }
  }, [cashAlertNotifications.length, storeUnreadCount, dispatch]);

  // Update app badge count
  React.useEffect(() => {
    pushNotificationService.setBadgeCount(storeUnreadCount);
  }, [storeUnreadCount]);

  const styles = createStyles(COLORS);

  return (
    <ScreenContainer style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>FINANCIAL MONITORING</Text>
          <Text style={styles.headerTitle}>Cash Alerts</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              console.log('🧪 Testing notification...');
              pushNotificationService.showCashAlert(
                'Test Cash Alert',
                'This is a test notification to verify push notifications are working',
                { test: true }
              );
            }}
            style={[styles.refreshButton, { marginRight: 8 }]}
            activeOpacity={0.7}
          >
            <Icon name="bell" size={22} color={COLORS.orange} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            <Icon name="refresh-cw" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          cashAlertNotifications.length === 0 && styles.scrollContentCentered
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
          {/* Cash Alert Notifications */}
          {cashAlertNotifications.map(notification => {
            // Parse the message to extract key information
            const message = notification.message;
            const surplusMatch = message.match(/surplus of ([\d,.]+ JOD)/i);
            const deficitMatch = message.match(/deficit of ([\d,.]+ JOD)/i);
            const startedMatch = message.match(/started.*with ([\d,.]+ JOD)/i);
            const endedMatch = message.match(/ended with ([\d,.]+ JOD)/i);
            
            const alertType = surplusMatch ? 'SURPLUS' : deficitMatch ? 'DEFICIT' : 'ALERT';
            const amount = surplusMatch?.[1] || deficitMatch?.[1] || '';
            
            return (
              <View key={notification.id} style={styles.alertCard}>
                <TouchableOpacity
                  style={styles.alertCardContent}
                  onPress={() => notification.stockNotification && handleStockNotificationPress(notification.stockNotification)}
                  activeOpacity={0.9}
                >
                  {/* Header with Badge and Time */}
                  <View style={styles.alertTopRow}>
                    <View style={styles.alertBadge}>
                      <Icon name="alert-circle" size={14} color={COLORS.orange} />
                      <Text style={styles.alertBadgeText}>CASH {alertType}</Text>
                    </View>
                    <View style={styles.alertTimeContainer}>
                      <Icon name="clock" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.alertTimeText}>{notification.time}</Text>
                    </View>
                  </View>

                  {/* Main Alert Content */}
                  <View style={styles.alertMainRow}>
                    <View style={styles.alertIconContainer}>
                      <Icon name="dollar-sign" size={28} color={COLORS.orange} />
                    </View>
                    
                    <View style={styles.alertContent}>
                      <Text style={styles.alertTitle}>{notification.title}</Text>
                      
                      {/* Amount Highlight if available */}
                      {amount && (
                        <View style={styles.amountHighlight}>
                          <Text style={styles.amountLabel}>
                            {alertType === 'SURPLUS' ? 'Surplus Amount' : 'Deficit Amount'}
                          </Text>
                          <Text style={styles.amountValue}>{amount}</Text>
                        </View>
                      )}
                      
                      {/* Full Message */}
                      <Text style={styles.alertMessage}>{message}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}

        {cashAlertNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Icon name="dollar-sign" size={48} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.emptyStateTitle}>No Cash Alerts</Text>
            <Text style={styles.emptyStateMessage}>
              No cash alerts at the moment. New alerts will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20, // Reduced since SafeAreaView now handles the top spacing
    paddingBottom: 24,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.containerGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
  },
  alertCardContent: {
    padding: 20,
  },
  alertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orange + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  alertBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.orange,
    letterSpacing: 0.8,
  },
  alertTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertTimeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  alertMainRow: {
    flexDirection: 'row',
    gap: 16,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.orange + '15',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  amountHighlight: {
    backgroundColor: colors.orange + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.orange,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.orange,
    letterSpacing: -0.5,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.containerGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptyStateMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
    fontWeight: '500',
  },
  // Legacy styles for swipeable notifications (kept for compatibility)
  swipeableContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 24,
    borderRadius: 8,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  swipeableCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  swipeableCardBorder: {
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  swipeableContent: {
    padding: 20,
    backgroundColor: colors.surface,
  },
  swipeableTitle: {
    color: colors.textPrimary,
  },
  swipeableTime: {
    color: colors.textSecondary,
  },
  swipeableMessage: {
    color: colors.textSecondary,
  },
  passwordResetCard: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  passwordResetTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  passwordResetTime: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  passwordResetMessage: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
  passwordResetBackground: {
    backgroundColor: colors.purple,
  },
  pinnedNotificationContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pinnedNotification: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 20,
  },
  pinnedNotificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinnedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  pinnedTitleText: {
    flex: 1,
    fontSize: 22,
    marginBottom: 0,
  },
  pinnedTimeTop: {
    marginTop: 0,
    textAlign: 'right',
    flexShrink: 0,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 0,
  },
  pinnedTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 0,
  },
  notificationTime: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
    marginTop: 0,
  },
  pinnedTime: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'right',
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 2,
  },
  pinnedMessage: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    lineHeight: 20,
  },
  criticalRedNotification: {
    backgroundColor: colors.error,
  },
  criticalYellowNotification: {
    backgroundColor: colors.warning,
  },
  criticalNotificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  criticalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  criticalTitleText: {
    flex: 1,
    fontSize: 22,
    marginBottom: 0,
  },
  criticalTime: {
    textAlign: 'right',
    fontSize: 14,
    marginTop: 0,
    flexShrink: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default NotificationsScreen;