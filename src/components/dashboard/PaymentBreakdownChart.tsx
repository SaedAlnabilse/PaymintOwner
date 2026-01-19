import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface PaymentMethodData {
  method: string;
  amount: number;
  color: string;
  icon: string;
}

interface PaymentBreakdownChartProps {
  cashSales: number;
  cardSales: number;
  otherSales: number;
  title?: string;
}

const PaymentBreakdownChart: React.FC<PaymentBreakdownChartProps> = ({
  cashSales,
  cardSales,
  otherSales,
  title = "Payment Methods"
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const total = cashSales + cardSales + otherSales;

  const data: PaymentMethodData[] = [
    { method: 'Cash', amount: cashSales, color: COLORS.primary, icon: 'cash' },
    { method: 'Card', amount: cardSales, color: COLORS.blue, icon: 'credit-card' },
    { method: 'Other', amount: otherSales, color: COLORS.orange, icon: 'dots-horizontal-circle' },
  ].filter(d => d.amount > 0);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD`;
  };

  const getPercentage = (amount: number) => {
    if (total === 0) return 0;
    return (amount / total) * 100;
  };

  // Calculate pie chart angles
  let currentAngle = -90; // Start from top
  const pieSegments = data.map(item => {
    const percentage = getPercentage(item.amount);
    const angle = (percentage / 100) * 360;
    const segment = {
      ...item,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      percentage,
    };
    currentAngle += angle;
    return segment;
  });

  // Create SVG-like path for pie segments (simplified visual)
  const pieSize = 120;
  const pieRadius = pieSize / 2;

  if (total === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="chart-pie" size={20} color={COLORS.primary} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.emptyState}>
          <Icon name="chart-pie" size={48} color={COLORS.textTertiary} />
          <Text style={styles.emptyText}>No payment data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="chart-pie" size={20} color={COLORS.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.contentRow}>
        {/* Pie Chart Visualization */}
        <View style={styles.pieContainer}>
          <View style={[styles.pieChart, { width: pieSize, height: pieSize }]}>
            {pieSegments.map((segment, index) => {
              // Simplified: show as stacked bars in circular arrangement
              const widthPercent = segment.percentage;
              return (
                <View
                  key={segment.method}
                  style={[
                    styles.pieSegment,
                    {
                      backgroundColor: segment.color,
                      flex: widthPercent,
                    }
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.pieCenterLabel}>
            <Text style={styles.pieTotalLabel}>Total</Text>
            <Text style={styles.pieTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={item.method} style={styles.legendItem}>
              <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View style={[styles.legendIconContainer, { backgroundColor: item.color + '15' }]}>
                  <Icon name={item.icon} size={14} color={item.color} />
                </View>
                <Text style={styles.legendLabel}>{item.method}</Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={[styles.legendPercentage, { color: item.color }]}>
                  {getPercentage(item.amount).toFixed(0)}%
                </Text>
                <Text style={styles.legendAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Progress Bar Visualization */}
      <View style={styles.progressContainer}>
        {data.map((item, index) => (
          <View
            key={item.method}
            style={[
              styles.progressSegment,
              {
                flex: getPercentage(item.amount),
                backgroundColor: item.color,
                borderTopLeftRadius: index === 0 ? 4 : 0,
                borderBottomLeftRadius: index === 0 ? 4 : 0,
                borderTopRightRadius: index === data.length - 1 ? 4 : 0,
                borderBottomRightRadius: index === data.length - 1 ? 4 : 0,
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pieContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChart: {
    flexDirection: 'row',
    borderRadius: 60,
    overflow: 'hidden',
    transform: [{ rotate: '0deg' }],
  },
  pieSegment: {
    height: '100%',
  },
  pieCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  pieTotalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pieTotalValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  legendContainer: {
    flex: 1,
    marginLeft: 20,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '800',
  },
  legendAmount: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.containerGray,
  },
  progressSegment: {
    height: '100%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

export default PaymentBreakdownChart;
