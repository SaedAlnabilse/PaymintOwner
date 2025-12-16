import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment-timezone';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

interface Order {
    id: string;
    orderNumber?: string | number;
    total: number;
    status: string;
    createdAt: string;
    isRefunded?: boolean;
    paymentMethod?: string;
    employeeName?: string;
}

interface RecentOrdersFeedProps {
    orders: Order[];
    onOrderPress?: (orderId: string) => void;
    onViewAll?: () => void;
    maxItems?: number;
}

const RecentOrdersFeed: React.FC<RecentOrdersFeedProps> = ({
    orders,
    onOrderPress,
    onViewAll,
    maxItems = 5
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = createStyles(COLORS);

    const recentOrders = orders.slice(0, maxItems);

    const formatCurrency = (amount: number) => {
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD`;
    };

    const getStatusColor = (order: Order) => {
        if (order.isRefunded || order.status === 'REFUNDED') {
            return { bg: COLORS.errorBg, text: COLORS.error, label: 'Refunded' };
        }
        if (order.status === 'COMPLETED') {
            return { bg: COLORS.successBg, text: COLORS.primary, label: 'Completed' };
        }
        if (order.status === 'VOIDED' || order.status === 'CANCELLED') {
            return { bg: COLORS.containerGray, text: COLORS.textSecondary, label: 'Voided' };
        }
        return { bg: COLORS.warningBg, text: COLORS.warning, label: order.status };
    };

    const getPaymentIcon = (method?: string) => {
        switch (method?.toLowerCase()) {
            case 'card': return 'credit-card';
            case 'cash': return 'cash';
            default: return 'cash';
        }
    };

    const getTimeAgo = (dateString: string) => {
        const now = moment().tz('Asia/Amman');
        const date = moment(dateString).tz('Asia/Amman');
        const diffMinutes = now.diff(date, 'minutes');

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
        return date.format('MMM D, h:mm A');
    };

    if (recentOrders.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: COLORS.badgeBg }]}>
                            <Icon name="receipt" size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.title}>Recent Orders</Text>
                    </View>
                </View>
                <View style={styles.emptyState}>
                    <Icon name="inbox-outline" size={48} color={COLORS.textTertiary} />
                    <Text style={styles.emptyText}>No Orders Yet Today</Text>
                    <Text style={styles.emptySubtext}>Orders will appear here as they come in</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: COLORS.badgeBg }]}>
                        <Icon name="receipt" size={20} color={COLORS.primary} />
                    </View>
                    <View>
                        <Text style={styles.title}>Recent Orders</Text>
                        <Text style={styles.subtitle}>{orders.length} orders today</Text>
                    </View>
                </View>
                {onViewAll && (
                    <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
                        <Text style={[styles.viewAllText, { color: COLORS.primary }]}>View All</Text>
                        <Icon name="chevron-right" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ordersContainer}
            >
                {recentOrders.map((order, index) => {
                    const statusInfo = getStatusColor(order);
                    return (
                        <TouchableOpacity
                            key={order.id}
                            style={[
                                styles.orderCard,
                                index === 0 && styles.firstCard,
                                { backgroundColor: COLORS.cardBg }
                            ]}
                            onPress={() => onOrderPress?.(order.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.orderTop}>
                                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                                    <Text style={[styles.statusText, { color: statusInfo.text }]}>
                                        {statusInfo.label}
                                    </Text>
                                </View>
                                <Text style={styles.orderTime}>{getTimeAgo(order.createdAt)}</Text>
                            </View>

                            <View style={styles.orderMiddle}>
                                <Text style={styles.orderNumber}>
                                    #{order.orderNumber || order.id.slice(-6)}
                                </Text>
                                <Text style={[styles.orderTotal, { color: COLORS.primary }]}>
                                    {formatCurrency(order.total)}
                                </Text>
                            </View>

                            <View style={styles.orderBottom}>
                                <View style={styles.paymentInfo}>
                                    <Icon
                                        name={getPaymentIcon(order.paymentMethod)}
                                        size={14}
                                        color={COLORS.textTertiary}
                                    />
                                    <Text style={styles.paymentText}>
                                        {order.paymentMethod || 'Cash'}
                                    </Text>
                                </View>
                                {order.employeeName && (
                                    <Text style={styles.employeeText} numberOfLines={1}>
                                        {order.employeeName.split(' ')[0]}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {orders.length > maxItems && (
                    <TouchableOpacity
                        style={[styles.moreCard, { backgroundColor: COLORS.badgeBg }]}
                        onPress={onViewAll}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.moreCount, { color: COLORS.primary }]}>
                            +{orders.length - maxItems}
                        </Text>
                        <Text style={[styles.moreText, { color: COLORS.primary }]}>more</Text>
                        <Icon name="chevron-right" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.textSecondary,
        marginTop: 2,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 10,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    emptySubtext: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    ordersContainer: {
        paddingBottom: 4,
    },
    orderCard: {
        width: 160,
        padding: 14,
        borderRadius: 14,
        marginRight: 12,
    },
    firstCard: {
        marginLeft: 0,
    },
    orderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    orderTime: {
        fontSize: 10,
        fontWeight: '500',
        color: colors.textTertiary,
    },
    orderMiddle: {
        marginBottom: 12,
    },
    orderNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    orderBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    paymentText: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.textSecondary,
        textTransform: 'capitalize',
    },
    employeeText: {
        fontSize: 11,
        fontWeight: '500',
        color: colors.textSecondary,
        maxWidth: 60,
    },
    moreCard: {
        width: 80,
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    moreCount: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    moreText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default RecentOrdersFeed;
