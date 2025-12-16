import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

interface HourlySales {
    hour: number;
    sales: number;
}

interface SalesTrendChartProps {
    data: HourlySales[];
    title?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 80;
const CHART_HEIGHT = 150;
const BAR_COUNT = 12; // Show 12 time slots

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data, title = 'Sales Trend' }) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = createStyles(COLORS);

    // Aggregate data into time slots
    const chartData = useMemo(() => {
        const slots: { label: string; sales: number }[] = [];
        const maxSales = Math.max(...data.map(d => d.sales), 1);

        // Group hours into 2-hour slots for better visualization
        for (let i = 0; i < 24; i += 2) {
            const slotSales = data
                .filter(d => d.hour >= i && d.hour < i + 2)
                .reduce((sum, d) => sum + d.sales, 0);

            const label = i === 0 ? '12a' :
                i === 12 ? '12p' :
                    i < 12 ? `${i}a` : `${i - 12}p`;

            slots.push({ label, sales: slotSales });
        }

        return { slots, maxSales };
    }, [data]);

    const totalSales = useMemo(() => {
        return data.reduce((sum, d) => sum + d.sales, 0);
    }, [data]);

    const peakHour = useMemo(() => {
        const peak = data.reduce((max, d) => d.sales > max.sales ? d : max, { hour: 0, sales: 0 });
        if (peak.sales === 0) return 'N/A';
        const period = peak.hour >= 12 ? 'PM' : 'AM';
        const displayHour = peak.hour === 0 ? 12 : peak.hour > 12 ? peak.hour - 12 : peak.hour;
        return `${displayHour}:00 ${period}`;
    }, [data]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: COLORS.badgeBg }]}>
                        <Text style={[styles.chartIcon, { color: COLORS.primary }]}>📈</Text>
                    </View>
                    <Text style={styles.title}>{title}</Text>
                </View>
                <View style={styles.headerStats}>
                    <View style={styles.miniStat}>
                        <Text style={styles.miniStatLabel}>Peak Hour</Text>
                        <Text style={[styles.miniStatValue, { color: COLORS.primary }]}>{peakHour}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.chartContainer}>
                {/* Y-axis labels */}
                <View style={styles.yAxis}>
                    <Text style={styles.yAxisLabel}>
                        {chartData.maxSales.toFixed(0)}
                    </Text>
                    <Text style={styles.yAxisLabel}>
                        {(chartData.maxSales / 2).toFixed(0)}
                    </Text>
                    <Text style={styles.yAxisLabel}>0</Text>
                </View>

                {/* Chart area */}
                <View style={styles.chartArea}>
                    {/* Grid lines */}
                    <View style={styles.gridLines}>
                        <View style={[styles.gridLine, { backgroundColor: COLORS.borderLight }]} />
                        <View style={[styles.gridLine, { backgroundColor: COLORS.borderLight }]} />
                        <View style={[styles.gridLine, { backgroundColor: COLORS.borderLight }]} />
                    </View>

                    {/* Bars */}
                    <View style={styles.barsContainer}>
                        {chartData.slots.map((slot, index) => {
                            const barHeight = chartData.maxSales > 0
                                ? (slot.sales / chartData.maxSales) * CHART_HEIGHT
                                : 0;

                            const isHighest = slot.sales === chartData.maxSales && slot.sales > 0;

                            return (
                                <View key={index} style={styles.barGroup}>
                                    <View style={styles.barWrapper}>
                                        <View
                                            style={[
                                                styles.bar,
                                                {
                                                    height: Math.max(barHeight, 2),
                                                    backgroundColor: isHighest
                                                        ? COLORS.primary
                                                        : slot.sales > 0
                                                            ? COLORS.primary + '80'
                                                            : COLORS.containerGray,
                                                },
                                            ]}
                                        />
                                        {isHighest && slot.sales > 0 && (
                                            <View style={[styles.peakIndicator, { backgroundColor: COLORS.primary }]}>
                                                <Text style={styles.peakValue}>
                                                    {slot.sales >= 1000 ? `${(slot.sales / 1000).toFixed(1)}k` : slot.sales.toFixed(0)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.xAxisLabel}>{slot.label}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* Summary footer */}
            <View style={styles.footer}>
                <View style={[styles.footerItem, { backgroundColor: COLORS.successBg }]}>
                    <Text style={[styles.footerLabel, { color: COLORS.textSecondary }]}>Total Sales</Text>
                    <Text style={[styles.footerValue, { color: COLORS.primary }]}>
                        {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD
                    </Text>
                </View>
                <View style={[styles.footerItem, { backgroundColor: COLORS.badgeBg }]}>
                    <Text style={[styles.footerLabel, { color: COLORS.textSecondary }]}>Avg/Hour</Text>
                    <Text style={[styles.footerValue, { color: COLORS.primary }]}>
                        {(totalSales / 24).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD
                    </Text>
                </View>
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
        marginBottom: 20,
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
    chartIcon: {
        fontSize: 18,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.3,
    },
    headerStats: {
        flexDirection: 'row',
        gap: 12,
    },
    miniStat: {
        alignItems: 'flex-end',
    },
    miniStatLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    miniStatValue: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    chartContainer: {
        flexDirection: 'row',
        height: CHART_HEIGHT + 30,
    },
    yAxis: {
        width: 40,
        justifyContent: 'space-between',
        paddingRight: 8,
        paddingBottom: 20,
    },
    yAxisLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textTertiary,
        textAlign: 'right',
    },
    chartArea: {
        flex: 1,
        position: 'relative',
    },
    gridLines: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 20,
        justifyContent: 'space-between',
    },
    gridLine: {
        height: 1,
        opacity: 0.5,
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: CHART_HEIGHT,
        justifyContent: 'space-between',
    },
    barGroup: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: CHART_HEIGHT,
        position: 'relative',
    },
    bar: {
        width: 12,
        borderRadius: 6,
        minHeight: 2,
    },
    peakIndicator: {
        position: 'absolute',
        top: -20,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    peakValue: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    xAxisLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: colors.textTertiary,
        marginTop: 6,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    footerItem: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    footerLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    footerValue: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
});

export default SalesTrendChart;
