import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
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

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data, title = 'Sales Trend' }) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const styles = createStyles(COLORS);

    // Process data for the chart (last 6 active hours or key intervals)
    const chartData = useMemo(() => {
        // Create an array of 24 hours initialized to 0
        const fullDay = Array(24).fill(0).map((_, i) => ({ hour: i, sales: 0 }));
        
        // Fill in actual sales data
        data.forEach(d => {
            if (d.hour >= 0 && d.hour < 24) {
                fullDay[d.hour].sales = d.sales;
            }
        });

        // Determine the range to show:
        // If data exists, show from the first sale hour to current hour/last sale hour
        // For visual clarity, we'll pick 6-hour intervals labels but plot all points
        
        const salesHours = data.map(d => d.hour);
        const minHour = salesHours.length > 0 ? Math.min(...salesHours) : 8; // Default start 8am
        const maxHour = salesHours.length > 0 ? Math.max(...salesHours) : 22; // Default end 10pm
        
        // Add some padding (e.g., start 2 hours before first sale, end 2 hours after)
        const start = Math.max(0, minHour - 2);
        const end = Math.min(23, maxHour + 2);
        
        // Slice the relevant part of the day
        const displayData = fullDay.slice(start, end + 1);
        
        return {
            labels: displayData.map(d => {
                // Show label every 3 hours to avoid clutter
                if (d.hour % 3 === 0) {
                    const h = d.hour;
                    return h === 0 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h-12}p` : `${h}a`;
                }
                return '';
            }),
            data: displayData.map(d => d.sales),
            fullData: displayData // Keep full objects if needed
        };
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

    if (data.length === 0) {
        return null; 
    }

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

            <View style={styles.chartWrapper}>
                <LineChart
                    data={{
                        labels: chartData.labels,
                        datasets: [
                            {
                                data: chartData.data,
                                color: (opacity = 1) => COLORS.primary, // optional
                                strokeWidth: 3 // optional
                            }
                        ]
                    }}
                    width={screenWidth - 80} // Container padding adjustment
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix=""
                    yAxisInterval={1}
                    chartConfig={{
                        backgroundColor: COLORS.surface,
                        backgroundGradientFrom: COLORS.surface,
                        backgroundGradientTo: COLORS.surface,
                        decimalPlaces: 0,
                        color: (opacity = 1) => isDarkMode ? `rgba(124, 195, 159, ${opacity})` : `rgba(124, 195, 159, ${opacity})`,
                        labelColor: (opacity = 1) => COLORS.textSecondary,
                        style: {
                            borderRadius: 16
                        },
                        propsForDots: {
                            r: "4",
                            strokeWidth: "2",
                            stroke: COLORS.surface
                        },
                        propsForBackgroundLines: {
                            strokeDasharray: "", // solid lines
                            stroke: COLORS.borderLight,
                            strokeWidth: 1
                        }
                    }}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16,
                        marginLeft: -20 // Adjust for left padding of chart library
                    }}
                    withInnerLines={true}
                    withOuterLines={false}
                    withVerticalLines={false}
                />
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
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
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
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
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
