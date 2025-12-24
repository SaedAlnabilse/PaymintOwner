import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment-timezone';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

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
    userName = 'Owner',
    userRole = 'Admin',
    storeStatus = 'CLOSED',
    unreadNotifications = 0,
    onRefresh,
    onMenuPress,
    onNotificationsPress,
    onProfilePress,
    onStorePress,
    showClock = true,
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const insets = useSafeAreaInsets();
    const styles = createStyles(COLORS);

    const [currentTime, setCurrentTime] = useState(moment().tz('Asia/Amman'));

    useEffect(() => {
        if (!showClock) return;

        const timer = setInterval(() => {
            setCurrentTime(moment().tz('Asia/Amman'));
        }, 1000);

        return () => clearInterval(timer);
    }, [showClock]);

    const formattedDate = currentTime.format('ddd, MMM D, YYYY');
    const formattedTime = currentTime.format('h:mm:ss A');

    const isOpen = storeStatus === 'OPEN';
    const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Left Section - Branding and Menu */}
            <View style={styles.leftSection}>
                {/* Menu Button */}
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={onMenuPress}
                    activeOpacity={0.7}
                >
                    <Icon name="menu" size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>

                {/* Logo/Brand */}
                <View style={[styles.logoContainer, { backgroundColor: COLORS.primary }]}>
                    <Icon name="store" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.brandInfo}>
                    <Text style={styles.brandName} numberOfLines={1}>{storeName}</Text>
                    <Text style={styles.brandTagline}>Back Office</Text>
                </View>
            </View>

            {/* Right Section - Status, Clock, Actions */}
            <View style={styles.rightSection}>
                {/* Store Status */}
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: isOpen ? COLORS.successBg : COLORS.errorBg }
                ]}>
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: isOpen ? COLORS.primary : COLORS.error }
                    ]} />
                    <Text style={[
                        styles.statusText,
                        { color: isOpen ? COLORS.primary : COLORS.error }
                    ]}>
                        {isOpen ? 'Open' : 'Closed'}
                    </Text>
                </View>

                {/* Clock */}
                {showClock && (
                    <View style={styles.clockContainer}>
                        <Text style={styles.dateText}>{formattedDate}</Text>
                        <Text style={[styles.timeText, { color: COLORS.primary }]}>{formattedTime}</Text>
                    </View>
                )}

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: COLORS.border }]} />

                {/* Refresh */}
                {onRefresh && (
                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: COLORS.badgeBg }]}
                        onPress={onRefresh}
                        activeOpacity={0.7}
                    >
                        <Icon name="refresh" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                )}

                {/* Notifications */}
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onNotificationsPress}
                    activeOpacity={0.7}
                >
                    <Icon name="bell-outline" size={22} color={COLORS.textSecondary} />
                    {unreadNotifications > 0 && (
                        <View style={[styles.notificationBadge, { backgroundColor: COLORS.error }]}>
                            <Text style={styles.notificationBadgeText}>
                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View >
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
        gap: 16,
    },
    menuButton: {
        padding: 4,
        marginRight: -4,
    },
    logoContainer: {
        width: 38,
        height: 38,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandInfo: {
        justifyContent: 'center',
        gap: 0, // Ensure no extra gap
    },
    brandName: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
        lineHeight: 22,
    },
    brandTagline: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1, // Increased spacing for better readability
        lineHeight: 12,
        marginTop: -1, // Pull it up slightly
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    clockContainer: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 10,
        fontWeight: '500',
        color: colors.textTertiary,
        lineHeight: 14,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        lineHeight: 16,
    },
    divider: {
        width: 1,
        height: 24,
        marginHorizontal: 4,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        minWidth: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: colors.surface,
    },
    notificationBadgeText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#FFFFFF',
    },
});

export default BackOfficeHeader;
