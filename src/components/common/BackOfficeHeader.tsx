import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment-timezone';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { shiftService, Shift } from '../../services/shiftService';
import ShiftInfoModal from './ShiftInfoModal';
import { useFocusEffect } from '@react-navigation/native';

interface BackOfficeHeaderProps {
    storeName?: string;
    userName?: string;
    userRole?: string;
    storeStatus?: 'OPEN' | 'CLOSED';
    unreadNotifications?: number;
    onRefresh?: () => void;
    onMenuPress?: () => void;
    onNotificationsPress?: () => void;
    onProfilePress?: () => void;
    onStorePress?: () => void;
    showClock?: boolean;
}

const BackOfficeHeader: React.FC<BackOfficeHeaderProps> = ({
    storeName = 'Paymint Store',
    userName: _userName = 'Owner',
    userRole: _userRole = 'Admin',
    storeStatus: _storeStatus = 'CLOSED',
    unreadNotifications = 0,
    onRefresh,
    onMenuPress,
    onNotificationsPress,
    onProfilePress: _onProfilePress,
    onStorePress: _onStorePress,
    showClock = true,
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const insets = useSafeAreaInsets();
    const styles = createStyles(COLORS);

    const [currentTime, setCurrentTime] = useState(moment().tz('Asia/Amman'));
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);
    const [lastShift, setLastShift] = useState<Shift | null>(null);
    const [shiftModalVisible, setShiftModalVisible] = useState(false);
    const [shiftLoading, setShiftLoading] = useState(false);

    const fetchShiftStatus = useCallback(async () => {
        setShiftLoading(true);
        try {
            // 1. Check for ANY active shift in the store
            const activeShift = await shiftService.getStoreActiveShift();
            setCurrentShift(activeShift);

            // 2. If NO active shift, fetch the last closed shift for the store
            if (!activeShift) {
                const closedShift = await shiftService.getLatestClosedShift();
                setLastShift(closedShift);
            }
        } catch (error) {
            console.error('Failed to fetch store shift status', error);
        } finally {
            setShiftLoading(false);
        }
    }, []);

    // Fetch shift status on mount and when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchShiftStatus();
        }, [fetchShiftStatus])
    );

    useEffect(() => {
        if (!showClock) return;

        const timer = setInterval(() => {
            setCurrentTime(moment().tz('Asia/Amman'));
        }, 1000);

        return () => clearInterval(timer);
    }, [showClock]);

    const handleShiftPress = () => {
        setShiftModalVisible(true);
    };

    const formattedDate = currentTime.format('ddd, MMM D, YYYY');
    const formattedTime = currentTime.format('h:mm:ss A');

    const isOpen = !!currentShift;

    return (
        <>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Left Section - Branding and Menu */}
                <View style={styles.leftSection}>
                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={onMenuPress}
                        activeOpacity={0.7}
                    >
                        <Icon name="menu" size={26} color={COLORS.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.brandingContainer}>
                        <View style={[styles.logoContainer, { backgroundColor: COLORS.primary }]}>
                            <Icon name="store" size={20} color="#FFFFFF" />
                        </View>
                        <Text style={styles.brandName} numberOfLines={1}>{storeName}</Text>
                    </View>
                </View>

                {/* Right Section - Status, Clock, Actions */}
                <View style={styles.rightSection}>
                    {/* Store Status Pill */}
                    <TouchableOpacity
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor: isDarkMode ? (isOpen ? COLORS.successBg + '20' : COLORS.errorBg + '20') : (isOpen ? COLORS.successBg : COLORS.errorBg),
                                borderColor: isOpen ? COLORS.primary + '20' : COLORS.error + '20',
                                borderWidth: 1,
                            }
                        ]}
                        onPress={handleShiftPress}
                        activeOpacity={0.7}
                    >
                        {shiftLoading ? (
                            <ActivityIndicator size="small" color={isOpen ? COLORS.primary : COLORS.error} style={styles.loader} />
                        ) : (
                            <View style={[
                                styles.statusDot,
                                { backgroundColor: isOpen ? COLORS.primary : COLORS.error }
                            ]} />
                        )}
                        <Text style={[
                            styles.statusText,
                            { color: isOpen ? COLORS.primary : COLORS.error }
                        ]}>
                            {isOpen ? 'Open' : 'Closed'}
                        </Text>
                        <Icon
                            name="chevron-down"
                            size={14}
                            color={isOpen ? COLORS.primary : COLORS.error}
                            style={{ opacity: 0.6 }}
                        />
                    </TouchableOpacity>

                    {/* Quick Activity Button Container */}
                    <View style={styles.quickActions}>
                        {onRefresh && (
                            <TouchableOpacity
                                style={styles.actionCircle}
                                onPress={onRefresh}
                                activeOpacity={0.6}
                            >
                                <Icon name="refresh" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.actionCircle}
                            onPress={onNotificationsPress}
                            activeOpacity={0.6}
                        >
                            <Icon name="bell-outline" size={21} color={COLORS.textSecondary} />
                            {unreadNotifications > 0 && (
                                <View style={[styles.activeDot, { backgroundColor: COLORS.error }]} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View >

            <ShiftInfoModal
                visible={shiftModalVisible}
                status={isOpen ? 'OPEN' : 'CLOSED'}
                onClose={() => setShiftModalVisible(false)}
                shift={isOpen ? currentShift : lastShift}
            />
        </>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        paddingHorizontal: 24,
        paddingBottom: 12,
        paddingTop: 12, // Default top padding if inset is 0
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        // Height removed to allow dynamic sizing based on safe area
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButton: {
        padding: 8,
        marginLeft: -8,
        marginRight: 4,
    },
    brandingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    brandName: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },

    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    quickActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    actionCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 6,
        height: 6,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: colors.surface,
    },
    loader: {
        marginRight: 4,
    },
});

export default BackOfficeHeader;
