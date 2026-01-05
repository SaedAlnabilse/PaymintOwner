import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment-timezone';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';
import { fetchEmployeeShifts } from '../../services/reports';
import { ShiftSummary } from '../../types/reports';

interface ShiftItemProps {
  item: ShiftSummary;
  styles: any;
  colors: any;
  calculateDuration: (start: string, end: string | null) => string;
  formatCurrency: (amount: number) => string;
}

const ShiftItem: React.FC<ShiftItemProps> = ({ item, styles, colors, calculateDuration, formatCurrency }) => (
  <View style={styles.shiftCard}>
    <View style={styles.shiftHeader}>
      <View style={styles.dateContainer}>
        <Icon name="calendar-blank" size={16} color={colors.textSecondary} />
        <Text style={[styles.dateText, { color: colors.textPrimary }]}>
          {moment(item.startTime).format('ddd, MMM D')}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: item.endTime ? colors.containerGray : colors.successBg }]}>
        <Text style={[styles.statusText, { color: item.endTime ? colors.textSecondary : colors.primary }]}>
          {item.endTime ? 'Completed' : 'Active'}
        </Text>
      </View>
    </View>

    <View style={styles.timeRow}>
      <View style={styles.timeBlock}>
        <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Start</Text>
        <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
          {moment(item.startTime).format('h:mm A')}
        </Text>
      </View>
      <View style={styles.arrowContainer}>
        <Icon name="arrow-right" size={16} color={colors.border} />
      </View>
      <View style={styles.timeBlock}>
        <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>End</Text>
        <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
          {item.endTime ? moment(item.endTime).format('h:mm A') : 'Now'}
        </Text>
      </View>
      <View style={styles.durationBlock}>
        <Icon name="clock-time-four-outline" size={14} color={colors.primary} />
        <Text style={[styles.durationText, { color: colors.primary }]}>
          {calculateDuration(item.startTime, item.endTime)}
        </Text>
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.statsRow}>
      <View style={styles.stat}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Sales</Text>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCurrency(item.totalSales)}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cash</Text>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCurrency(item.cashSales)}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Card</Text>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCurrency(item.cardSales)}</Text>
      </View>
    </View>
  </View>
);

interface ShiftHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
}

const ShiftHistoryModal: React.FC<ShiftHistoryModalProps> = ({
  visible,
  onClose,
  staffId,
  staffName
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);

  const [shifts, setShifts] = useState<ShiftSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch shifts for the last 30 days
      const endDate = moment().toISOString();
      const startDate = moment().subtract(30, 'days').toISOString();

      const data = await fetchEmployeeShifts(startDate, endDate, staffId);
      // Sort by newest first
      setShifts(data.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    } catch (error) {
      console.error('Failed to load shifts:', error);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    if (visible && staffId) {
      loadShifts();
    }
  }, [visible, staffId, loadShifts]);

  const calculateDuration = (start: string, end: string | null) => {
    const startTime = moment(start);
    const endTime = end ? moment(end) : moment();

    const duration = moment.duration(endTime.diff(startTime));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();

    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.modalContent}>
          <View style={[styles.header, { backgroundColor: COLORS.white, borderBottomColor: COLORS.borderLight }]}>
            <View>
              <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Shift History</Text>
              <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>{staffName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={shifts}
              renderItem={({ item }) => (
                <ShiftItem
                  item={item}
                  styles={styles}
                  colors={COLORS}
                  calculateDuration={calculateDuration}
                  formatCurrency={formatCurrency}
                />
              )}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Icon name="clock-alert-outline" size={48} color={COLORS.textTertiary} />
                  <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                    No shift history found for the last 30 days
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Add padding
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500, // Limit width on large screens
    maxHeight: '85%', // Prevent full screen
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    flex: 1, // Allow content to expand
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  shiftCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeBlock: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  arrowContainer: {
    paddingHorizontal: 12,
  },
  durationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    opacity: 0.7,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default ShiftHistoryModal;
