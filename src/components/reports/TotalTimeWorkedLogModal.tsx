import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment-timezone';
import { fetchPayInPayOutLog } from '../../services/reports';
import { PayInPayOutLogEntry } from '../../types/reports';
import { getColors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

interface TotalTimeWorkedLogModalProps {
  visible: boolean;
  onClose: () => void;
  startDate: Date;
  endDate: Date;
  startTime?: Date;
  endTime?: Date;
  employeeId?: string | null;
  activeHours?: string;
  lastUpdated?: string;
}

const ShiftLogItem = React.memo(({ item, COLORS }: { item: PayInPayOutLogEntry; COLORS: any }) => {
  const isEnter = item.type === 'CASH_IN' || item.type === 'SHIFT_START';
  const color = isEnter ? COLORS.primary : COLORS.error;
  const iconName = isEnter ? 'arrow-down-circle' : 'arrow-up-circle';
  const title = isEnter ? 'Enter Shift' : 'Exit Shift';
  const styles = createStyles(COLORS);

  // Handle timestamp vs createdAt
  const entryDateStr = item.timestamp || item.createdAt;
  const entryDate = entryDateStr ? new Date(entryDateStr) : new Date();

  return (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <View style={styles.typeContainer}>
          <Icon
            name={iconName}
            size={20}
            color={color}
          />
          <Text
            style={[
              styles.logType,
              { color: color },
            ]}
          >
            {title}
          </Text>
        </View>
        <Text style={styles.logAmount}>
          {typeof item.amount === 'number' ? `${item.amount.toFixed(3)} JOD` : ''}
        </Text>
      </View>

      {item.reason && (
        <Text style={styles.logReason}>Reason: {item.reason}</Text>
      )}

      {item.note && (
        <Text style={styles.logNote}>Note: {item.note}</Text>
      )}

      <View style={styles.logFooter}>
        <View style={styles.userContainer}>
          <Icon name="account" size={14} color={COLORS.textSecondary} />
          <Text style={styles.logUser}>{item.userName || 'N/A'}</Text>
        </View>
        <Text style={styles.logTime}>
          {moment(entryDate).format('MMM D, h:mm A')}
        </Text>
      </View>
    </View>
  );
});

const TotalTimeWorkedLogModal: React.FC<TotalTimeWorkedLogModalProps> = ({
  visible,
  onClose,
  startDate,
  endDate,
  startTime,
  endTime,
  employeeId,
  activeHours = '0 hrs',
  lastUpdated = 'Today',
}) => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = React.useMemo(() => createStyles(COLORS), [COLORS]);
  const [entries, setEntries] = useState<PayInPayOutLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to combine date and time properly
  const combineDateAndTime = (date: Date, time?: Date): Date => {
    if (!time) return date;

    const combined = new Date(date);
    const timeToUse = new Date(time);
    combined.setHours(
      timeToUse.getHours(),
      timeToUse.getMinutes(),
      timeToUse.getSeconds(),
      timeToUse.getMilliseconds()
    );
    return combined;
  };

  // Get the actual start and end datetime for API calls
  const getFilteredDateRange = useCallback(() => {
    const actualStartDate = combineDateAndTime(startDate, startTime);
    const actualEndDate = combineDateAndTime(endDate, endTime);
    return { actualStartDate, actualEndDate };
  }, [startDate, startTime, endDate, endTime]);

  const fetchShiftEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { actualStartDate, actualEndDate } = getFilteredDateRange();

      const response = await fetchPayInPayOutLog(
        actualStartDate.toISOString(),
        actualEndDate.toISOString(),
        {
          employeeId: employeeId || undefined,
          page: 1,
          limit: 100,
        },
      );

      if (response && response.entries) {
        // Filter for CASH_IN (Enter Shift) and CASH_OUT (Exit Shift) entries
        // Also include SHIFT_START/SHIFT_END for compatibility
        const filteredEntries = response.entries.filter(
          (entry: PayInPayOutLogEntry) => ['CASH_IN', 'CASH_OUT', 'SHIFT_START', 'SHIFT_END'].includes(entry.type),
        );
        setEntries(filteredEntries);
      } else {
        setEntries([]);
      }
    } catch (e: any) {
      console.error('Failed to fetch shift entries:', e);
      setError(e?.message || 'Failed to load shift entries');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [getFilteredDateRange, employeeId]);

  useEffect(() => {
    if (visible) {
      fetchShiftEntries();
    } else {
      setEntries([]);
      setError(null);
    }
  }, [visible, fetchShiftEntries]);

  const calculatedTotalShifts = entries.filter(e => e.type === 'CASH_IN' || e.type === 'SHIFT_START').length;
  const calculatedActiveHours = entries.length > 0 ? activeHours : '0.00 hrs';

  const ListHeader = () => (
    <View style={styles.summaryContainer}>
      <View style={[styles.summaryCard, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.summaryCardLabel}>TOTAL SHIFTS</Text>
        <Text style={styles.summaryCardValue}>{calculatedTotalShifts}</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.summaryCardLabel}>ACTIVE HOURS</Text>
        <Text style={styles.summaryCardValue}>{calculatedActiveHours}</Text>
      </View>
      <View style={[styles.summaryCard, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.summaryCardLabel}>LAST UPDATED</Text>
        <Text style={styles.summaryCardValue}>{lastUpdated}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>
                Shift Log
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ListHeader />

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                bounces={true}
                keyboardShouldPersistTaps="handled"
              >
                {entries.length > 0 ? (
                  entries.map((item) => (
                    <ShiftLogItem
                      key={item.id || `${item.type}-${item.timestamp || item.createdAt}`}
                      item={item}
                      COLORS={COLORS}
                    />
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Icon name="text-box-search-outline" size={48} color={COLORS.textTertiary} />
                    <Text style={styles.emptyText}>No Records Found</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardAvoidingView: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  modalContent: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  logItem: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logType: {
    fontSize: 14,
    fontWeight: '600',
  },
  logAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logReason: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
    fontWeight: '500'
  },
  logNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic'
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logUser: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  logTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textTertiary,
    fontSize: 16,
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  summaryCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryCardLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryCardValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default TotalTimeWorkedLogModal;