import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { HourlySales } from '../../services/reports';

const { width } = Dimensions.get('window');

interface PeakHoursChartProps {
  data: HourlySales[];
  title?: string;
}

const PeakHoursChart: React.FC<PeakHoursChartProps> = ({
  data,
  title = "Peak Hours"
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  // Filter to only show hours with data and business hours (6 AM - 11 PM)
  const businessHours = data.filter(h => h.hour >= 6 && h.hour <= 23);
  const maxSales = Math.max(...businessHours.map(h => h.sales), 1);

  // Find peak hour
  const peakHour = businessHours.reduce((max, h) => h.sales > max.sales ? h : max, businessHours[0]);

  const formatHour = (hour: number) => {
    if (hour === 0 || hour === 12) return `${hour === 0 ? 12 : 12}${hour < 12 ? 'a' : 'p'}`;
    return `${hour > 12 ? hour - 12 : hour}${hour < 12 ? 'a' : 'p'}`;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}k`;
    }
    return amount.toFixed(0);
  };

  // Group into time slots (every 2 hours) for better mobile display
  const timeSlots: { label: string; sales: number; orders: number; startHour: number }[] = [];
  for (let i = 6; i <= 22; i += 2) {
    const slot1 = businessHours.find(h => h.hour === i);
    const slot2 = businessHours.find(h => h.hour === i + 1);
    timeSlots.push({
      label: `${formatHour(i)}-${formatHour(i + 2)}`,
      sales: (slot1?.sales || 0) + (slot2?.sales || 0),
      orders: (slot1?.orderCount || 0) + (slot2?.orderCount || 0),
      startHour: i,
    });
  }

  const maxSlotSales = Math.max(...timeSlots.map(s => s.sales), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="chart-bar" size={20} color={COLORS.primary} />
          <Text style={styles.title}>{title}</Text>
        </View>
        {peakHour && peakHour.sales > 0 && (
          <View style={styles.peakBadge}>
            <Icon name="fire" size={14} color={COLORS.orange} />
            <Text style={styles.peakText}>
              Peak: {formatHour(peakHour.hour)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        {timeSlots.map((slot, index) => {
          const barHeight = (slot.sales / maxSlotSales) * 100;
          const isPeak = slot.sales === maxSlotSales && slot.sales > 0;

          return (
            <View key={slot.startHour} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(barHeight, 5)}%`,
                      backgroundColor: isPeak
                        ? COLORS.primary
                        : barHeight > 60
                          ? COLORS.primary + 'CC'
                          : barHeight > 30
                            ? COLORS.primary + '99'
                            : COLORS.primary + '66'
                    }
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{formatHour(slot.startHour)}</Text>
              {slot.sales > 0 && (
                <Text style={styles.barValue}>{formatCurrency(slot.sales)}</Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Sales Amount (JOD)</Text>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  peakText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.orange,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: '70%',
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 8,
  },
  barValue: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textTertiary,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default PeakHoursChart;
