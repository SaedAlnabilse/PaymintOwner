import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

interface TopEmployeeCardProps {
    employees: Array<{
        id: string;
        name: string;
        initials: string;
        role: string;
        todaySales: number;
        todayOrderCount: number;
        todayHours: number;
        isClockedIn: boolean;
    }>;
    onViewAll?: () => void;
}

const TopEmployeesCard: React.FC<TopEmployeeCardProps> = ({ employees, onViewAll }) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = createStyles(COLORS);

    // Sort by todaySales and take top 3
    const topPerformers = [...employees]
        .filter(e => e.todaySales > 0)
        .sort((a, b) => b.todaySales - a.todaySales)
        .slice(0, 3);

    const getMedalEmoji = (index: number) => {
        switch (index) {
            case 0: return '🥇';
            case 1: return '🥈';
            case 2: return '🥉';
            default: return '';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'manager': return COLORS.graphGray;
            case 'barista': return COLORS.warning;
            case 'server': return COLORS.neutralGray;
            case 'owner':
            case 'admin': return COLORS.primary;
            case 'cashier': return COLORS.neutralGray;
            default: return COLORS.textSecondary;
        }
    };

    const formatCurrency = (amount: number) => {
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD`;
    };

    if (topPerformers.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: COLORS.warningBg }]}>
                            <Icon name="trophy" size={20} color={COLORS.warning} />
                        </View>
                        <Text style={styles.title}>Top Performers</Text>
                    </View>
                </View>
                <View style={styles.emptyState}>
                    <Icon name="account-group-outline" size={40} color={COLORS.textTertiary} />
                    <Text style={styles.emptyText}>No Sales Activity Yet Today</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: COLORS.warningBg }]}>
                        <Icon name="trophy" size={20} color={COLORS.warning} />
                    </View>
                    <Text style={styles.title}>Top Performers</Text>
                </View>
                {onViewAll && (
                    <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
                        <Text style={[styles.viewAllText, { color: COLORS.primary }]}>View All</Text>
                        <Icon name="chevron-right" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {topPerformers.map((employee, index) => (
                <View
                    key={employee.id}
                    style={[
                        styles.employeeRow,
                        index === 0 && styles.topEmployeeRow,
                        index === topPerformers.length - 1 && styles.lastRow,
                    ]}
                >
                    <View style={styles.rankContainer}>
                        <Text style={styles.rankEmoji}>{getMedalEmoji(index)}</Text>
                    </View>

                    <View style={[styles.avatar, { backgroundColor: COLORS.containerGray }]}>
                        <Text style={[styles.avatarText, { color: getRoleColor(employee.role) }]}>
                            {employee.initials}
                        </Text>
                        {employee.isClockedIn && (
                            <View style={[styles.statusDot, { backgroundColor: COLORS.primary, borderColor: COLORS.surface }]} />
                        )}
                    </View>

                    <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName} numberOfLines={1}>{employee.name}</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Icon name="receipt" size={12} color={COLORS.textTertiary} />
                                <Text style={styles.statText}>{employee.todayOrderCount} orders</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Icon name="clock-outline" size={12} color={COLORS.textTertiary} />
                                <Text style={styles.statText}>{employee.todayHours.toFixed(1)}h</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.salesContainer}>
                        <Text style={[styles.salesAmount, { color: COLORS.primary }]}>
                            {formatCurrency(employee.todaySales)}
                        </Text>
                    </View>
                </View>
            ))}

            {/* Active employees count */}
            <View style={styles.footer}>
                <View style={[styles.footerBadge, { backgroundColor: COLORS.successBg }]}>
                    <View style={[styles.activeDot, { backgroundColor: COLORS.primary }]} />
                    <Text style={[styles.footerText, { color: COLORS.primary }]}>
                        {employees.filter(e => e.isClockedIn).length} Active Now
                    </Text>
                </View>
                <Text style={styles.totalText}>
                    Total: {employees.length} staff members
                </Text>
            </View>
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
        alignItems: 'center',
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
        paddingVertical: 30,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    employeeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    topEmployeeRow: {
        backgroundColor: colors.warningBg + '30',
        marginHorizontal: -20,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 4,
        borderBottomWidth: 0,
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    rankContainer: {
        width: 30,
        alignItems: 'center',
    },
    rankEmoji: {
        fontSize: 18,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        position: 'relative',
    },
    avatarText: {
        fontSize: 15,
        fontWeight: '800',
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
    },
    employeeInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    salesContainer: {
        alignItems: 'flex-end',
    },
    salesAmount: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    footerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '700',
    },
    totalText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.textSecondary,
    },
});

export default TopEmployeesCard;
