import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Feather';
import moment from 'moment-timezone';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { RootState, AppDispatch } from '../store/store';
import {
  fetchHistoricalSummary,
  fetchTopSellingItems,
} from '../store/slices/reportsSlice';
import { 
  fetchOrdersHistory, 
  fetchEmployees, 
  fetchEmployeeShifts, 
  fetchPayInPayOutLog,
  fetchOrderDetails,
  getLiveShiftReport,
  fetchUserName,
} from '../services/reports';
import { 
  HistoricalOrder, 
  Employee, 
  ShiftSummary, 
  PayInPayOutLogEntry,
  OrderDetails,
  LiveShiftReport 
} from '../types/reports';
import { ScreenContainer } from '../components/ScreenContainer';

import PayInPayOutLogModal from '../components/reports/PayInPayOutLogModal';
import TotalTimeWorkedLogModal from '../components/reports/TotalTimeWorkedLogModal';
import OrderDetailsModal from '../components/reports/OrderDetailsModal';
import CustomDateTimePicker from '../components/CustomDateTimePicker'; // Import CustomDateTimePicker
import { useTimeValidation } from '../hooks/useTimeValidation'; // Import useTimeValidation
import { getColors } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const ReportsScreen = () => {
  const { isDarkMode } = useTheme();
  const COLORS = getColors(isDarkMode);
  const styles = createStyles(COLORS);
  const dispatch = useDispatch<AppDispatch>();

  const reports = useSelector((state: RootState) => state.reports);
  const summary = reports?.historicalSummary?.data;
  const topItems = reports?.topSellingItems?.data || [];

  // Data State
  const [orders, setOrders] = useState<HistoricalOrder[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftSummary[]>([]);
  const [payInOutLogs, setPayInOutLogs] = useState<PayInPayOutLogEntry[]>([]);
  const [liveShiftData, setLiveShiftData] = useState<LiveShiftReport | null>(null);
  const [totalTimeWorked, setTotalTimeWorked] = useState('0h 0m');
  const [refreshing, setRefreshing] = useState(false);
  
  // Custom Date Controls State
  const [showCustomControls, setShowCustomControls] = useState(false);
  
  // Date/Time Picker State
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date()); // Default start of day
  const [endTime, setEndTime] = useState(new Date()); // Default end of day
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // State for time validation errors
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);

  const { validateRange } = useTimeValidation({
      onValidationError: (result) => {
        console.warn(result.message);
        setTimeValidationError(result.message);
      },
  });

  // Helper function to combine date and time
  const combineDateAndTime = (date: Date, time: Date): Date => {
    const combined = new Date(date);
    combined.setHours(
      time.getHours(),
      time.getMinutes(),
      time.getSeconds(),
      time.getMilliseconds()
    );
    return combined;
  };

  // Calculate actual refunds from orders list
  const calculatedRefunds = orders.reduce((total, order) => {
    if (order.isRefunded || order.status === 'REFUNDED') {
      return total + Math.abs(order.total);
    }
    return total;
  }, 0);
  
  // Filter State
  const [selectedRange, setSelectedRange] = useState<'today' | 'last7' | 'last30' | 'thisMonth' | 'custom'>('today');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  
  // Dropdown State
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);

  // Modal State
  const [showPayInOutModal, setShowPayInOutModal] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false);

  // Animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const getTodayInJordan = () => moment.tz('Asia/Amman');

  const getDateRange = useCallback(() => {
    const now = getTodayInJordan();
    
    if (selectedRange === 'custom') {
        // Combine date and time
        const start = moment(startDate);
        start.hour(startTime.getHours()).minute(startTime.getMinutes());
        
        const end = moment(endDate);
        end.hour(endTime.getHours()).minute(endTime.getMinutes());
        
        return {
            startDate: start.toDate(),
            endDate: end.toDate(),
        };
    }

    switch (selectedRange) {
      case 'today':
        return {
          startDate: now.clone().startOf('day').toDate(),
          endDate: now.clone().endOf('day').toDate(),
        };
      case 'last7':
        return {
          startDate: now.clone().subtract(7, 'days').startOf('day').toDate(),
          endDate: now.clone().endOf('day').toDate(),
        };
      case 'last30':
        return {
          startDate: now.clone().subtract(30, 'days').startOf('day').toDate(),
          endDate: now.clone().endOf('day').toDate(),
        };
      case 'thisMonth':
        return {
          startDate: now.clone().startOf('month').toDate(),
          endDate: now.clone().endOf('day').toDate(),
        };
      default:
        return {
          startDate: now.clone().startOf('day').toDate(),
          endDate: now.clone().endOf('day').toDate(),
        };
    }
  }, [selectedRange, startDate, endDate, startTime, endTime]);

  // Initialize custom date state on mount
  useEffect(() => {
      const now = getTodayInJordan();
      setStartDate(now.toDate());
      setEndDate(now.toDate());
      setStartTime(now.clone().startOf('day').toDate());
      setEndTime(now.clone().endOf('day').toDate());
  }, []);

  const formatDuration = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      return `${h}h ${m}m`;
  };

  // Recalculate total time worked (Historical + Live)
  useEffect(() => {
    let intervalId: any = null;

    const calculate = () => {
      const historicalMinutes = (summary?.totalHoursWorked || 0) * 60;
      let currentShiftMinutes = 0;

      // Check if there is a live shift and if it belongs to the selected employee (or if showing all)
      const shiftStartTime = liveShiftData?.shiftStartTime || liveShiftData?.shift?.startTime;
      
      if (shiftStartTime) {
          // If filtering by employee, only add if it matches
          // Note: live-shift-status endpoint doesn't return userId, but it is fetched based on the query.
          // If we are viewing 'All Employees', getLiveShiftReport() returns current user's status.
          // This might be a slight inaccuracy for 'All Employees' view active timer (it only shows timer if YOU are active), 
          // but for specific employee view it will be correct.
          // For now, we assume if we have data, it's relevant.
          
          // For legacy check (if shift object exists)
          const isMatchingEmployee = !selectedEmployee || (liveShiftData?.shift?.userId ? liveShiftData.shift.userId === selectedEmployee : true);
          
          if (isMatchingEmployee) {
             const shiftStart = new Date(shiftStartTime);
             const now = new Date();
             const elapsedMilliseconds = now.getTime() - shiftStart.getTime();
             currentShiftMinutes = Math.max(0, Math.floor(elapsedMilliseconds / 60000));
          }
      }

      setTotalTimeWorked(formatDuration(historicalMinutes + currentShiftMinutes));
    };

    calculate(); // Initial calc
    intervalId = setInterval(calculate, 60000); // Update every minute

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [summary?.totalHoursWorked, liveShiftData, selectedEmployee]);

  const fetchAllData = useCallback(async () => {
    const { startDate, endDate } = getDateRange();
    const isoStartDate = startDate.toISOString();
    const isoEndDate = endDate.toISOString();
    
    // If shift selected, override dates
    let actualStartDate = isoStartDate;
    let actualEndDate = isoEndDate;

    if (selectedShift) {
        const shift = shifts.find(s => s.id === selectedShift);
        if (shift) {
            actualStartDate = shift.startTime;
            actualEndDate = shift.endTime || moment().toISOString();
        }
    }

    // Pass employeeId to Redux actions
    const fetchParams: any = { 
        startDate: actualStartDate, 
        endDate: actualEndDate,
    };
    if (selectedEmployee) {
      fetchParams.employeeId = selectedEmployee;
    }

    dispatch(fetchHistoricalSummary(fetchParams)); 
    dispatch(fetchTopSellingItems(fetchParams));

    try {
      // Direct API calls
      const ordersData = await fetchOrdersHistory(actualStartDate, actualEndDate, {
        page: 1,
        limit: 100, 
        status: 'ALL',
        employeeId: selectedEmployee || undefined
      });
      setOrders(ordersData || []);
      
      // Fetch Cash Logs
      const logsResponse = await fetchPayInPayOutLog(actualStartDate, actualEndDate, {
          employeeId: selectedEmployee || undefined,
          limit: 100
      });
      
      const rawLogs = logsResponse?.entries || (Array.isArray(logsResponse) ? logsResponse : []);
      const cashLogs = rawLogs.map((log: any) => ({
          ...log,
          timestamp: log.createdAt || log.timestamp
      }));

      // Note: Shifts are now fetched internally by TotalTimeWorkedLogModal
      
      const allLogs = [...cashLogs].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setPayInOutLogs(allLogs);

      // Fetch Live Shift Data (for timer)
      // We only fetch this if looking at "Today" or current range roughly
      const isToday = moment(startDate).isSame(moment(), 'day');
      if (isToday || !selectedRange) {
          const liveReport = await getLiveShiftReport();
          setLiveShiftData(liveReport);
      } else {
          setLiveShiftData(null);
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [dispatch, getDateRange, selectedEmployee, selectedShift, shifts, selectedRange]);

  const fetchEmployeesList = useCallback(async () => {
      try {
          const data = await fetchEmployees();
          setEmployees(data || [])  
      } catch (error) {
          console.error('Failed to fetch employees', error);
          setEmployees([]);
      }
  }, []);

  const fetchShiftsList = useCallback(async () => {
      if (!selectedEmployee) {
          setShifts([]);
          return;
      }
      const dateRange = getDateRange();
      console.log('📅 Fetching shifts for date range:', {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          selectedRange,
          selectedEmployee
      });
      try {
          const data = await fetchEmployeeShifts(
              dateRange.startDate.toISOString(), 
              dateRange.endDate.toISOString(),
              selectedEmployee
          );
          console.log('📅 Shifts fetched:', data?.length || 0, 'shifts');
          setShifts(Array.isArray(data) ? data : []);
      } catch (error) {
          console.error('Failed to fetch shifts', error);
          setShifts([]);
      }
  }, [selectedEmployee, getDateRange, selectedRange]);

  // Initial Load
  useFocusEffect(
    useCallback(() => {
      fetchEmployeesList();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true }),
      ]).start();
    }, [fetchEmployeesList])
  );

  // Data Refresh
  useEffect(() => {
      fetchAllData();
  }, [fetchAllData]);

  // Shifts Refresh
  useEffect(() => {
      fetchShiftsList();
  }, [fetchShiftsList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [fetchAllData]);

  const handleOrderClick = async (orderId: string) => {
      setIsLoadingOrderDetails(true);
      setShowOrderDetailsModal(true);
      try {
          const details = await fetchOrderDetails(orderId);
          
          // Safe check for employeeId or userId before fetching name
          const userIdToFetch = details.employeeId || (details as any).userId;

          if (details && userIdToFetch && (!details.employeeName || details.employeeName === 'Unknown')) {
              try {
                  const name = await fetchUserName(userIdToFetch);
                  if (name) {
                      details.employeeName = name;
                  }
              } catch (err) {
                  console.log('Failed to fetch user name for order', err);
              }
          }
          
          setSelectedOrderDetails(details);
      } catch (error) {
          console.error("Failed to fetch order details", error);
          // Ideally show user feedback here, but for now just log
      } finally {
          setIsLoadingOrderDetails(false);
      }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = typeof amount === 'number' ? amount : 0;
    return `${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JOD`;
  };

  // Calculate dates for modal
  const { startDate: defaultStart, endDate: defaultEnd } = getDateRange();
  let modalStartDate = defaultStart;
  let modalEndDate = defaultEnd;

  if (selectedShift) {
     const shift = shifts.find(s => s.id === selectedShift);
     if (shift) {
         modalStartDate = new Date(shift.startTime);
         modalEndDate = shift.endTime ? new Date(shift.endTime) : new Date();
     }
  }

  return (
    <ScreenContainer style={{ backgroundColor: COLORS.background }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>BUSINESS ANALYTICS</Text>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>
        <View style={styles.headerActions}>
             {/* Employee Filter */}
            <TouchableOpacity 
                style={[styles.filterButton, selectedEmployee && styles.filterButtonActive]}
                onPress={() => setShowEmployeeDropdown(true)}
            >
                <Icon name="users" size={18} color={selectedEmployee ? COLORS.white : COLORS.textPrimary} />
                {selectedEmployee && <View style={styles.filterBadge} />}
            </TouchableOpacity>

            {/* Shift Filter (Only if employee selected) */}
            {selectedEmployee && (
                <TouchableOpacity 
                    style={[styles.filterButton, selectedShift && styles.filterButtonActive]}
                    onPress={() => setShowShiftDropdown(true)}
                >
                    <MaterialIcon name="schedule" size={20} color={selectedShift ? COLORS.white : COLORS.textPrimary} />
                    {selectedShift && <View style={styles.filterBadge} />}
                </TouchableOpacity>
            )}

            <TouchableOpacity 
                onPress={onRefresh} 
                style={styles.refreshButton}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcon name="refresh" size={22} color={COLORS.primary} />
            </TouchableOpacity>
        </View>
      </View>

      {/* Employee Dropdown Modal */}
      <Modal visible={showEmployeeDropdown} transparent animationType="fade" onRequestClose={() => setShowEmployeeDropdown(false)}>
          <View style={styles.modalOverlay}>
              <Pressable style={styles.backdrop} onPress={() => setShowEmployeeDropdown(false)} />
              <View style={styles.dropdownContainer}>
                  <Text style={styles.dropdownTitle}>Filter by Employee</Text>
                  <TouchableOpacity 
                      style={styles.dropdownItem}
                      onPress={() => { setSelectedEmployee(null); setSelectedShift(null); setShowEmployeeDropdown(false); }}
                  >
                      <Text style={[styles.dropdownItemText, !selectedEmployee && styles.dropdownItemTextActive]}>All Employees</Text>
                      {!selectedEmployee && <Icon name="check" size={16} color={COLORS.green} />}
                  </TouchableOpacity>
                  <ScrollView 
                      style={styles.dropdownScrollView}
                      contentContainerStyle={styles.dropdownScrollContent}
                      showsVerticalScrollIndicator={true}
                      bounces={true}
                      nestedScrollEnabled={true}
                  >
                      {employees.map(emp => (
                          <TouchableOpacity 
                              key={emp.id}
                              style={styles.dropdownItem}
                              onPress={() => { setSelectedEmployee(emp.id); setSelectedShift(null); setShowEmployeeDropdown(false); }}
                              activeOpacity={0.7}
                          >
                              <Text style={[styles.dropdownItemText, selectedEmployee === emp.id && styles.dropdownItemTextActive]}>{emp.name}</Text>
                              {selectedEmployee === emp.id && <Icon name="check" size={16} color={COLORS.green} />}
                          </TouchableOpacity>
                      ))}
                  </ScrollView>
              </View>
          </View>
      </Modal>

       {/* Shift Dropdown Modal */}
       <Modal visible={showShiftDropdown} transparent animationType="fade" onRequestClose={() => setShowShiftDropdown(false)}>
          <View style={styles.modalOverlay}>
              <Pressable style={styles.backdrop} onPress={() => setShowShiftDropdown(false)} />
              <View style={styles.dropdownContainer}>
                  <Text style={styles.dropdownTitle}>Filter by Shift</Text>
                  <TouchableOpacity 
                      style={styles.dropdownItem}
                      onPress={() => { setSelectedShift(null); setShowShiftDropdown(false); }}
                  >
                      <Text style={[styles.dropdownItemText, !selectedShift && styles.dropdownItemTextActive]}>All Shifts</Text>
                      {!selectedShift && <Icon name="check" size={16} color={COLORS.green} />}
                  </TouchableOpacity>
                  <ScrollView 
                      style={styles.dropdownScrollView}
                      contentContainerStyle={styles.dropdownScrollContent}
                      showsVerticalScrollIndicator={true}
                      bounces={true}
                      nestedScrollEnabled={true}
                  >
                      {shifts.length > 0 ? shifts.map((shift, index) => (
                          <TouchableOpacity 
                              key={shift.id || `shift-${index}`}
                              style={styles.dropdownItem}
                              onPress={() => { setSelectedShift(shift.id); setShowShiftDropdown(false); }}
                              activeOpacity={0.7}
                          >
                              <View style={{ flex: 1 }}>
                                  <Text style={[styles.dropdownItemText, selectedShift === shift.id && styles.dropdownItemTextActive]}>
                                      {shift.startTime ? moment(shift.startTime).format('MMM D, h:mm A') : 'Unknown Date'}
                                  </Text>
                                  <Text style={styles.shiftSubtext}>
                                      {shift.endTime ? moment(shift.endTime).format('h:mm A') : 'Ongoing'} • {formatCurrency(shift.totalSales)}
                                  </Text>
                              </View>
                              {selectedShift === shift.id && <Icon name="check" size={16} color={COLORS.green} />}
                          </TouchableOpacity>
                      )) : (
                          <View style={{ padding: 20, alignItems: 'center' }}>
                              <Text style={{ color: COLORS.gray }}>No shifts found for this period</Text>
                          </View>
                      )}
                  </ScrollView>
              </View>
          </View>
      </Modal>

      {/* Date Range Selector */}
      <View style={styles.rangeSelectorWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeSelectorContent}>
          {[
            { key: 'custom', label: 'Custom', icon: 'edit-calendar' },
            { key: 'today', label: 'Today', icon: 'calendar-today' },
            { key: 'last7', label: 'Last 7 Days', icon: 'date-range' },
            { key: 'last30', label: 'Last 30 Days', icon: 'event' },
            { key: 'thisMonth', label: 'This Month', icon: 'calendar-month' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.rangeButton,
                selectedRange === item.key && styles.rangeButtonSelected,
              ]}
              onPress={() => {
                if (item.key === 'custom') {
                    if (selectedRange === 'custom') {
                        setShowCustomControls(!showCustomControls);
                    } else {
                        setSelectedRange('custom');
                        setShowCustomControls(true);
                    }
                } else {
                  setSelectedRange(item.key as any);
                  setShowCustomControls(false);
                }
              }}
              activeOpacity={0.8}
            >
              <MaterialIcon
                name={item.icon}
                size={16}
                color={selectedRange === item.key ? COLORS.white : COLORS.gray}
              />
              <Text style={[
                styles.rangeButtonText, 
                selectedRange === item.key && styles.rangeButtonTextSelected
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedRange === 'custom' && showCustomControls && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity 
                    style={[styles.rangeButton, { flex: 1, justifyContent: 'center' }]}
                    onPress={() => setShowStartDatePicker(true)}
                >
                    <Text style={styles.rangeButtonText}>
                        {moment(startDate).format('MMM D, YYYY')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.rangeButton, { flex: 1, justifyContent: 'center' }]}
                    onPress={() => setShowEndDatePicker(true)}
                >
                    <Text style={styles.rangeButtonText}>
                        {moment(endDate).format('MMM D, YYYY')}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity 
                    style={[styles.rangeButton, { flex: 1, justifyContent: 'center' }]}
                    onPress={() => setShowStartTimePicker(true)}
                >
                    <Text style={styles.rangeButtonText}>
                        {moment(startTime).format('h:mm A')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.rangeButton, { flex: 1, justifyContent: 'center' }]}
                    onPress={() => setShowEndTimePicker(true)}
                >
                    <Text style={styles.rangeButtonText}>
                        {moment(endTime).format('h:mm A')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
      )}

      <CustomDateTimePicker
        mode="date"
        visible={showStartDatePicker}
        value={startDate}
        onConfirm={(selectedDate) => {
            // If new start date is after end date, auto-adjust end date to match
            if (selectedDate > endDate) {
                setEndDate(selectedDate);
            }
            setStartDate(selectedDate);
            setShowStartDatePicker(false);
        }}
        onCancel={() => setShowStartDatePicker(false)}
      />
      
      <CustomDateTimePicker
        mode="date"
        visible={showEndDatePicker}
        value={endDate}
        onConfirm={(selectedDate) => {
            // If new end date is before start date, valid choice but start date is now "wrong" logically?
            // Or just force start date to match?
            if (selectedDate < startDate) {
                setStartDate(selectedDate);
            }
            setEndDate(selectedDate);
            setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
      />

      <CustomDateTimePicker
        mode="time"
        visible={showStartTimePicker}
        value={startTime}
        onConfirm={(selectedTime) => {
            // Validate time range
            // Combine dates and times to check full datetime
            const newStartDateTime = combineDateAndTime(startDate, selectedTime);
            const currentEndDateTime = combineDateAndTime(endDate, endTime);
            
            if (newStartDateTime > currentEndDateTime) {
                // Invalid range
                setTimeValidationError('Start time cannot be after end time');
                // Optionally keep picker open or just update and show error
                // Let's update it but the validation hook will catch it for the UI
            } else {
                setTimeValidationError(null);
            }
            setStartTime(selectedTime);
            setShowStartTimePicker(false);
        }}
        onCancel={() => setShowStartTimePicker(false)}
      />

      <CustomDateTimePicker
        mode="time"
        visible={showEndTimePicker}
        value={endTime}
        onConfirm={(selectedTime) => {
            const currentStartDateTime = combineDateAndTime(startDate, startTime);
            const newEndDateTime = combineDateAndTime(endDate, selectedTime);
            
            if (newEndDateTime < currentStartDateTime) {
                 setTimeValidationError('End time cannot be before start time');
            } else {
                setTimeValidationError(null);
            }
            setEndTime(selectedTime);
            setShowEndTimePicker(false);
        }}
        onCancel={() => setShowEndTimePicker(false)}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          
          {/* Featured Net Sales Card */}
          <View style={styles.featuredCard}>
            <View style={styles.featuredCardHeader}>
              <Text style={styles.featuredCardLabel}>Total Net Sales</Text>
              <View style={styles.statusIndicator}>
                <Icon name="trending-up" size={16} color="#FFFFFF" />
                <Text style={styles.statusIndicatorText}>Performance</Text>
              </View>
            </View>
            <Text style={styles.featuredCardValue}>{formatCurrency(summary?.totalNetSales ?? 0)}</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Card Sales */}
            <View style={[styles.statCard, { borderLeftColor: COLORS.purpleGray }]}>
               <View style={[styles.statIcon, { backgroundColor: COLORS.containerGray }]}>
                 <MaterialIcon name="credit-card" size={20} color={COLORS.purpleGray} />
               </View>
               <Text style={styles.statLabel}>CARD SALES</Text>
               <Text style={styles.statValue}>{formatCurrency(summary?.totalCardSales ?? 0)}</Text>
            </View>

            {/* Cash Sales */}
            <View style={[styles.statCard, { borderLeftColor: COLORS.green }]}>
               <View style={[styles.statIcon, { backgroundColor: COLORS.containerGray }]}>
                 <MaterialCommunityIcon name="cash" size={20} color={COLORS.green} />
               </View>
               <Text style={styles.statLabel}>CASH SALES</Text>
               <Text style={styles.statValue}>{formatCurrency(summary?.totalCashSales ?? 0)}</Text>
            </View>

            {/* Other Sales */}
            <View style={[styles.statCard, { borderLeftColor: COLORS.yellow }]}>
               <View style={[styles.statIcon, { backgroundColor: COLORS.containerGray }]}>
                 <MaterialCommunityIcon name="dots-horizontal-circle-outline" size={20} color={COLORS.yellow} />
               </View>
               <Text style={styles.statLabel}>OTHER SALES</Text>
               <Text style={styles.statValue}>{formatCurrency(summary?.totalOtherPayments ?? 0)}</Text>
            </View>

            {/* Orders */}
            <View style={[styles.statCard, { borderLeftColor: COLORS.blueGray }]}>
               <View style={[styles.statIcon, { backgroundColor: COLORS.containerGray }]}>
                 <MaterialIcon name="receipt-long" size={20} color={COLORS.blueGray} />
               </View>
               <Text style={styles.statLabel}>TOTAL ORDERS</Text>
               <Text style={styles.statValue}>{summary?.totalOrders ?? 0}</Text>
            </View>

            {/* Refunds */}
            <View style={[styles.statCard, { borderLeftColor: COLORS.red }]}>
               <View style={[styles.statIcon, { backgroundColor: COLORS.containerGray }]}>
                 <MaterialCommunityIcon name="cash-refund" size={20} color={COLORS.red} />
               </View>
               <Text style={styles.statLabel}>REFUNDS</Text>
               <Text style={[styles.statValue, { color: COLORS.red }]}>{formatCurrency(calculatedRefunds)}</Text>
            </View>

            {/* Cash In/Out Card - Clickable */}
            <TouchableOpacity 
                style={[styles.statCardClickable, { borderLeftColor: COLORS.orange }]}
                onPress={() => setShowPayInOutModal(true)}
                activeOpacity={0.7}
            >
               <View style={styles.cardContent}>
                 <View style={[styles.statIcon, { backgroundColor: COLORS.containerGray }]}>
                   <MaterialCommunityIcon name="bank-transfer" size={20} color={COLORS.orange} />
                 </View>
                 <Text style={styles.statLabel}>CASH IN/OUT</Text>
                 <View>
                     <Text style={[styles.statSubValue, { color: COLORS.green }]}>+{formatCurrency(summary?.totalPayIn ?? 0)}</Text>
                     <Text style={[styles.statSubValue, { color: COLORS.red }]}>-{formatCurrency(summary?.totalPayOut ?? 0)}</Text>
                 </View>
               </View>
               <Icon name="chevron-right" size={20} color={COLORS.textTertiary} style={styles.chevronIcon} />
            </TouchableOpacity>

            {/* Working Hours Card - Clickable */}
            <TouchableOpacity 
                style={[styles.statCardClickable, { borderLeftColor: COLORS.blue }]}
                onPress={() => setShowWorkingHoursModal(true)}
                activeOpacity={0.7}
            >
               <View style={styles.cardContent}>
                 <View style={[styles.statIcon, { backgroundColor: COLORS.containerGray }]}>
                   <MaterialCommunityIcon name="clock-outline" size={20} color={COLORS.blue} />
                 </View>
                 <Text style={styles.statLabel}>WORKING HOURS</Text>
                 <Text style={styles.statValue}>{totalTimeWorked}</Text>
               </View>
               <Icon name="chevron-right" size={20} color={COLORS.textTertiary} style={styles.chevronIcon} />
            </TouchableOpacity>
          </View>
          
          {/* Recent Orders List */}
          <View style={styles.section}>

             <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                   <MaterialIcon name="receipt" size={24} color={COLORS.darkNavy} />
                   <Text style={styles.sectionTitle}>Recent Orders</Text>
                </View>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{orders.length} Orders</Text>
                </View>
             </View>
             
             {orders.length > 0 ? (
                 <View style={{ maxHeight: 400 }}>
                     <ScrollView 
                        nestedScrollEnabled={true} 
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.ordersList}
                     >
                         {orders.map((order) => (
                             <TouchableOpacity 
                                 key={order.id} 
                                 style={styles.orderRow}
                                 onPress={() => handleOrderClick(order.id)}
                             >
                                 <View style={styles.orderInfo}>
                                     <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                                     <Text style={styles.orderDate}>{moment(order.createdAt).format('MMM D, h:mm A')}</Text>
                                 </View>
                                 <View style={styles.orderMeta}>
                                     <View style={[
                                         styles.statusBadge, 
                                         { backgroundColor: order.status === 'COMPLETED' ? COLORS.successBg : COLORS.errorBg }
                                     ]}>
                                         <Text style={[
                                             styles.statusText, 
                                             { color: order.status === 'COMPLETED' ? COLORS.successText : COLORS.errorText }
                                         ]}>
                                             {order.status}
                                         </Text>
                                     </View>
                                     <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                                     <Icon name="chevron-right" size={16} color={COLORS.gray} />
                                 </View>
                             </TouchableOpacity>
                         ))}
                     </ScrollView>
                 </View>
             ) : (
                 <View style={styles.emptyState}>
                     <Text style={styles.emptyText}>No recent orders</Text>
                 </View>
             )}
          </View>

          {/* Top Selling Items */}
          <View style={[styles.section, { marginTop: 24 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcon name="trophy" size={24} color={COLORS.yellow} />
                <Text style={styles.sectionTitle}>Top Selling Items</Text>
              </View>
              {topItems.length > 0 && (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{topItems.length} Items</Text>
                </View>
              )}
            </View>
            
            {topItems.length > 0 ? (
              <View style={styles.topItemsList}>
                {topItems.map((item, index) => (
                  <View key={index} style={styles.topItemRow}>
                    <View style={[
                      styles.rankBadge, 
                      index === 0 && { backgroundColor: COLORS.warningBg },
                      index === 1 && { backgroundColor: COLORS.cardBg },
                      index === 2 && { backgroundColor: COLORS.warningBg },
                    ]}>
                      {index < 3 ? (
                        <MaterialCommunityIcon 
                          name={index === 0 ? "crown" : index === 1 ? "medal" : "trophy-variant"} 
                          size={16} 
                          color={index === 0 ? COLORS.warning : index === 1 ? COLORS.graphGray : COLORS.orange} 
                        />
                      ) : (
                        <Text style={styles.rankText}>#{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.topItemInfo}>
                      <Text style={styles.topItemName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.topItemMeta}>
                         <MaterialCommunityIcon name="tag-outline" size={12} color={COLORS.gray} />
                         <Text style={styles.topItemDetail}>
                           {item.price ? formatCurrency(item.price) : 'N/A'}
                         </Text>
                      </View>
                    </View>
                    <View style={styles.topItemStats}>
                       <Text style={styles.topItemRevenue}>{formatCurrency(item.totalRevenue)}</Text>
                       <View style={styles.quantityBadge}>
                         <Icon name="shopping-bag" size={10} color={COLORS.green} />
                         <Text style={styles.quantityText}>{item.totalQuantitySold} sold</Text>
                       </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                 <View style={styles.emptyIconContainer}>
                    <MaterialCommunityIcon name="package-variant" size={40} color={COLORS.containerGray} />
                 </View>
                 <Text style={styles.emptyText}>No sales data for this period</Text>
              </View>
            )}
          </View>

        </Animated.View>
      </ScrollView>

      {/* Modals */}
      <PayInPayOutLogModal 
          visible={showPayInOutModal} 
          onClose={() => setShowPayInOutModal(false)}
          logs={payInOutLogs}
          isLoading={false}
          type="BOTH"
      />
      <TotalTimeWorkedLogModal 
          visible={showWorkingHoursModal} 
          onClose={() => setShowWorkingHoursModal(false)}
          startDate={modalStartDate}
          endDate={modalEndDate}
          employeeId={selectedEmployee}
          activeHours={totalTimeWorked}
      />
      <OrderDetailsModal 
          visible={showOrderDetailsModal} 
          onClose={() => setShowOrderDetailsModal(false)}
          order={selectedOrderDetails}
          isLoading={isLoadingOrderDetails}
      />

    </ScreenContainer>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    marginHorizontal: 20,
    marginTop: 10, // Reduced since SafeAreaView now handles the top spacing
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    // Cross-platform shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
  },
  filterButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
  },
  filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
  },
  filterBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.green,
      borderWidth: 1,
      borderColor: colors.white
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(129, 195, 132, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center'
  },
  backdrop: {
      ...StyleSheet.absoluteFillObject,
  },
  dropdownContainer: {
      width: width * 0.9,
      maxWidth: 500,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 4,
  },
  dropdownTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
      color: colors.textPrimary
  },
  dropdownScrollView: {
      height: 300,
  },
  dropdownScrollContent: {
      paddingBottom: 20,
  },
  dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
  },
  dropdownItemText: {
      fontSize: 16,
      color: colors.textPrimary
  },
  dropdownItemTextActive: {
      color: colors.primary,
      fontWeight: '600'
  },
  shiftSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2
  },
  rangeSelectorWrapper: {
    paddingVertical: 16,
  },
  rangeSelectorContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  },
  rangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'visible',
  },
  rangeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rangeButtonTextSelected: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  featuredCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  featuredCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredCardLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusIndicatorText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  featuredCardValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  statCardClickable: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 8,
    opacity: 0.5,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  statSubValue: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 2
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sectionBadge: {
    backgroundColor: 'rgba(129, 195, 132, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  topItemsList: {
    gap: 0,
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(129, 195, 132, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  topItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  topItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  topItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topItemDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  topItemStats: {
    alignItems: 'flex-end',
  },
  topItemRevenue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(129, 195, 132, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  quantityText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(129, 195, 132, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  ordersList: {
      gap: 0
  },
  orderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
  },
  orderInfo: {
      gap: 4
  },
  orderNumber: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary
  },
  orderDate: {
      fontSize: 12,
      color: colors.textSecondary
  },
  orderMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10
  },
  statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6
  },
  statusText: {
      fontSize: 11,
      fontWeight: '600'
  },
  orderTotal: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      minWidth: 70,
      textAlign: 'right'
  }
});

export default ReportsScreen;

