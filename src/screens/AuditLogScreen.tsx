import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import moment from 'moment-timezone';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import CustomDateTimePicker from '../components/CustomDateTimePicker';
import { ScreenContainer } from '../components/ScreenContainer';
import { fetchActivityLogs, ActivityLog } from '../services/activityLog';
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const AuditLogScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, _setPage] = useState<number>(1);

  // Helper to get current date in Jordan timezone
  const getTodayInJordan = () => moment.tz('Asia/Amman');

  // Set default to last 7 days to capture recent activity
  const [startDate, setStartDate] = useState<Date>(
    getTodayInJordan().subtract(7, 'days').startOf('day').toDate(),
  );
  const [endDate, setEndDate] = useState<Date>(
    getTodayInJordan().endOf('day').toDate(),
  );
  const [startTime, setStartTime] = useState<Date>(
    getTodayInJordan().startOf('day').toDate(),
  );
  const [endTime, setEndTime] = useState<Date>(
    getTodayInJordan().endOf('day').toDate(),
  );

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Temporary state for date/time picker values
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [tempStartTime, setTempStartTime] = useState<Date | null>(null);
  const [tempEndTime, setTempEndTime] = useState<Date | null>(null);

  // Helper function to combine date and time
  const combineDateAndTime = (date: Date, time: Date): Date => {
    const combined = new Date(date);
    combined.setHours(
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getMilliseconds(),
    );
    return combined;
  };

  // Time validation functions
  const validateTimeRange = (startDateTime: Date, endDateTime: Date): { isValid: boolean; adjustedEndDateTime?: Date; message?: string } => {
    if (startDateTime.toDateString() === endDateTime.toDateString()) {
      if (endDateTime <= startDateTime) {
        const adjustedEndDateTime = new Date(endDateTime);
        adjustedEndDateTime.setDate(adjustedEndDateTime.getDate() + 1);
        return {
          isValid: false,
          adjustedEndDateTime,
          message: `End time is before start time. Adjusting to next day.`
        };
      }
    }
    if (endDateTime < startDateTime) {
      return {
        isValid: false,
        message: 'End date and time cannot be before start date and time.'
      };
    }
    return { isValid: true };
  };

  const handleTimeValidation = (newStartTime?: Date, newEndTime?: Date) => {
    const currentStartTime = newStartTime || startTime;
    const currentEndTime = newEndTime || endTime;

    const startDateTime = combineDateAndTime(startDate, currentStartTime);
    const endDateTime = combineDateAndTime(endDate, currentEndTime);

    const validation = validateTimeRange(startDateTime, endDateTime);

    if (!validation.isValid && validation.adjustedEndDateTime) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      setEndDate(adjustedEndDate);
    } else if (!validation.isValid) {
      console.error('❌ Invalid time range:', validation.message);
    }
  };

  const getLogs = useCallback(async () => {
    setLoading(true);
    try {
      const actualStartDate = combineDateAndTime(startDate, startTime);
      const actualEndDate = combineDateAndTime(endDate, endTime);

      const startDateFormatted = moment(actualStartDate).format('YYYY-MM-DDTHH:mm:ss');
      const endDateFormatted = moment(actualEndDate).format('YYYY-MM-DDTHH:mm:ss');

      const logsData = await fetchActivityLogs({
        page,
        limit: 50,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
      });

      // Client-side filter to ensure logs are within the time range (just in case backend returns more)
      const filteredLogs = logsData.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= actualStartDate && logTime <= actualEndDate;
      });

      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, startTime, endTime]);

  useEffect(() => {
    getLogs();
  }, [getLogs]);

  const getActionIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('order') || desc.includes('sale')) return { icon: 'receipt', color: COLORS.primary };
    if (desc.includes('refund')) return { icon: 'cash-refund', color: COLORS.error };
    if (desc.includes('clock') || desc.includes('shift')) return { icon: 'clock-outline', color: COLORS.warning };
    if (desc.includes('item') || desc.includes('inventory')) return { icon: 'package-variant', color: COLORS.graphGray };
    if (desc.includes('user') || desc.includes('staff')) return { icon: 'account', color: COLORS.neutralGray };
    if (desc.includes('update') || desc.includes('edit')) return { icon: 'pencil', color: COLORS.neutralGray };
    if (desc.includes('delete')) return { icon: 'delete', color: COLORS.error };
    return { icon: 'information', color: COLORS.primary };
  };

  const renderLogItem = ({ item }: { item: ActivityLog }) => {
    const userName = item.performedBy?.name || 'Unknown User';
    const initials = userName.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2);
    const actionInfo = getActionIcon(item.description);
    const timeAgo = moment(item.timestamp).tz('Asia/Amman').fromNow();
    const fullTime = moment(item.timestamp).tz('Asia/Amman').format('MMM D, YYYY • h:mm A');

    return (
      <View style={[styles.logItem, { backgroundColor: COLORS.white }]}>
        <View style={styles.logLeft}>
          <View style={[styles.actionIconContainer, { backgroundColor: COLORS.containerGray }]}>
            <Icon name={actionInfo.icon} size={22} color={actionInfo.color} />
          </View>
          <View style={styles.timelineConnector} />
        </View>

        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: COLORS.containerGray }]}>
                <Text style={[styles.avatarText, { color: COLORS.primary }]}>{initials}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.logUser, { color: COLORS.textPrimary }]}>{userName}</Text>
                <View style={styles.timeRow}>
                  <Icon name="clock-outline" size={12} color={COLORS.textTertiary} />
                  <Text style={[styles.timeAgo, { color: COLORS.textSecondary }]}>{timeAgo}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.logBody}>
            <Text style={[styles.logAction, { color: COLORS.textPrimary }]}>{item.description}</Text>
            <Text style={[styles.logTimestamp, { color: COLORS.textTertiary }]}>{fullTime}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Activity Logs</Text>
            <Text style={[styles.headerSubtitle, { color: COLORS.textSecondary }]}>
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'} found
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: COLORS.primary }, loading && styles.disabledButton]}
            disabled={loading}
            onPress={() => getLogs()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Icon name="refresh" size={22} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <Text style={[styles.filterSectionTitle, { color: COLORS.textPrimary }]}>Filter by Date & Time</Text>
        
        <View style={styles.filterRow}>
          {/* Date Section */}
          <View style={styles.dateSection}>
            <Text style={[styles.filterLabel, { color: COLORS.textSecondary }]}>DATE RANGE</Text>
            <View style={[styles.filterGroup, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setTempStartDate(startDate);
                  setShowStartDatePicker(true);
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: COLORS.primary }]}>
                  <Icon name="calendar-start" size={18} color={COLORS.white} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.inputLabel, { color: COLORS.textTertiary }]}>Start</Text>
                  <Text style={[styles.dateText, { color: COLORS.textPrimary }]} numberOfLines={1}>
                    {moment(startDate).tz('Asia/Amman').format('MMM D')}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.separatorContainer}>
                <Icon name="arrow-right" size={14} color={COLORS.textTertiary} />
              </View>

              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setTempEndDate(endDate);
                  setShowEndDatePicker(true);
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: COLORS.primary }]}>
                  <Icon name="calendar-end" size={18} color={COLORS.white} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.inputLabel, { color: COLORS.textTertiary }]}>End</Text>
                  <Text style={[styles.dateText, { color: COLORS.textPrimary }]} numberOfLines={1}>
                    {moment(endDate).tz('Asia/Amman').format('MMM D')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Time Section */}
          <View style={styles.timeSection}>
            <Text style={[styles.filterLabel, { color: COLORS.textSecondary }]}>TIME RANGE</Text>
            <View style={[styles.filterGroup, { backgroundColor: COLORS.surface, borderColor: COLORS.border }]}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setTempStartTime(startTime);
                  setShowStartTimePicker(true);
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: COLORS.primary }]}>
                  <Icon name="clock-start" size={18} color={COLORS.white} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.inputLabel, { color: COLORS.textTertiary }]}>Start</Text>
                  <Text style={[styles.timeText, { color: COLORS.textPrimary }]} numberOfLines={1}>
                    {format(startTime, 'hh:mm a')}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.separatorContainer}>
                <Icon name="arrow-right" size={14} color={COLORS.textTertiary} />
              </View>

              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  setTempEndTime(endTime);
                  setShowEndTimePicker(true);
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: COLORS.primary }]}>
                  <Icon name="clock-end" size={18} color={COLORS.white} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.inputLabel, { color: COLORS.textTertiary }]}>End</Text>
                  <Text style={[styles.timeText, { color: COLORS.textPrimary }]} numberOfLines={1}>
                    {format(endTime, 'hh:mm a')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.listContainer, { backgroundColor: COLORS.background }]}>
        {loading && logs.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: COLORS.textSecondary }]}>Loading activity logs...</Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            renderItem={renderLogItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconContainer, { backgroundColor: COLORS.cardBg }]}>
                  <Icon name="text-box-search-outline" size={56} color={COLORS.textTertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: COLORS.textPrimary }]}>No activity logs found</Text>
                <Text style={[styles.emptyText, { color: COLORS.textSecondary }]}>
                  Try adjusting the date and time range
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Date & Time Pickers */}
      <CustomDateTimePicker
        mode="date"
        value={tempStartDate || startDate}
        visible={showStartDatePicker}
        onConfirm={(selectedDate) => {
          setShowStartDatePicker(false);
          setStartDate(selectedDate);
          if (endDate < selectedDate) setEndDate(selectedDate);
          setTempStartDate(null);
        }}
        onCancel={() => {
          setShowStartDatePicker(false);
          setTempStartDate(null);
        }}
        maximumDate={new Date()}
      />

      <CustomDateTimePicker
        mode="date"
        value={tempEndDate || endDate}
        visible={showEndDatePicker}
        onConfirm={(selectedDate) => {
          setShowEndDatePicker(false);
          setEndDate(selectedDate);
          setTempEndDate(null);
        }}
        onCancel={() => {
          setShowEndDatePicker(false);
          setTempEndDate(null);
        }}
        minimumDate={startDate}
        maximumDate={new Date()}
      />

      <CustomDateTimePicker
        mode="time"
        value={tempStartTime || startTime}
        visible={showStartTimePicker}
        onConfirm={(selectedTime) => {
          setShowStartTimePicker(false);
          setStartTime(selectedTime);
          setTimeout(() => handleTimeValidation(selectedTime), 100);
          setTempStartTime(null);
        }}
        onCancel={() => {
          setShowStartTimePicker(false);
          setTempStartTime(null);
        }}
      />

      <CustomDateTimePicker
        mode="time"
        value={tempEndTime || endTime}
        visible={showEndTimePicker}
        onConfirm={(selectedTime) => {
          setShowEndTimePicker(false);
          setEndTime(selectedTime);
          setTimeout(() => handleTimeValidation(undefined, selectedTime), 100);
          setTempEndTime(null);
        }}
        onCancel={() => {
          setShowEndTimePicker(false);
          setTempEndTime(null);
        }}
      />
    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  header: {
    padding: 20,
    paddingBottom: 16,
    marginHorizontal: 20,
    marginTop: 10, // Reduced since SafeAreaView now handles the top spacing
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateSection: {
    flex: 1,
  },
  timeSection: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: 6,
    height: 64,
    backgroundColor: colors.white,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separatorContainer: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  logLeft: {
    alignItems: 'center',
    marginRight: 14,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: colors.borderLight,
    marginTop: 4,
  },
  logContent: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  logHeader: {
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  userDetails: {
    flex: 1,
  },
  logUser: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeAgo: {
    fontSize: 12,
    fontWeight: '600',
  },
  logBody: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  logAction: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 6,
  },
  logTimestamp: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.containerGray,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AuditLogScreen;
