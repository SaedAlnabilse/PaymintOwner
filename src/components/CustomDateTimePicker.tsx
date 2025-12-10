import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Modal,
    Dimensions,
    ScrollView,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../constants/colors';
import moment from 'moment-timezone';

const { width: screenWidth } = Dimensions.get('window');

interface CustomDateTimePickerProps {
    mode: 'date' | 'time';
    value: Date;
    onConfirm: (date: Date) => void;
    onCancel: () => void;
    visible: boolean;
    minimumDate?: Date;
    maximumDate?: Date;
    validationError?: string | null;
    onValidationChange?: (isValid: boolean) => void;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
    mode,
    value,
    onConfirm,
    onCancel,
    visible,
    minimumDate,
    maximumDate,
    validationError,
    onValidationChange: _onValidationChange,
}) => {
    const { isDarkMode } = useTheme();
    const COLORS = getColors(isDarkMode);
    const [selectedDate, setSelectedDate] = useState(value);
    const hasError = !!validationError;

    useEffect(() => {
        setSelectedDate(value);
    }, [value]);

    const handleConfirm = () => {
        onConfirm(selectedDate);
    };

    const handleCancel = () => {
        setSelectedDate(value);
        onCancel();
    };

    const modalStyles = createStyles(COLORS);

    if (mode === 'date') {
        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleCancel}
            >
                <TouchableWithoutFeedback onPress={handleCancel}>
                    <View style={modalStyles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={[modalStyles.pickerContainer, { backgroundColor: COLORS.surface }, hasError && modalStyles.pickerContainerError]}>
                                <DatePickerContent
                                    selectedDate={selectedDate}
                                    onDateChange={setSelectedDate}
                                    minimumDate={minimumDate}
                                    maximumDate={maximumDate}
                                    colors={COLORS}
                                />
                                {hasError && (
                                    <View style={modalStyles.errorContainer}>
                                        <Icon name="alert-circle" size={18} color="#D55263" />
                                        <Text style={modalStyles.errorText}>{validationError}</Text>
                                    </View>
                                )}
                                <View style={[modalStyles.buttonContainer, { backgroundColor: COLORS.surface }]}>
                                    <TouchableOpacity
                                        style={[modalStyles.cancelButton, modalStyles.cancelButtonBackgroundColor]}
                                        onPress={handleCancel}
                                    >
                                        <Text style={[modalStyles.cancelButtonText, modalStyles.cancelButtonTextColor]}>
                                            CANCEL
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            modalStyles.confirmButton, 
                                            { backgroundColor: COLORS.primary },
                                        ]}
                                        onPress={handleConfirm}
                                    >
                                        <Text style={modalStyles.confirmButtonText}>OK</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <TouchableWithoutFeedback onPress={handleCancel}>
                <View style={modalStyles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={[modalStyles.pickerContainer, { backgroundColor: COLORS.surface }, hasError && modalStyles.pickerContainerError]}>
                            <TimePickerContent
                                selectedDate={selectedDate}
                                onTimeChange={setSelectedDate}
                                onValidationChange={_onValidationChange}
                                colors={COLORS}
                            />
                            {hasError && (
                                <View style={modalStyles.errorContainer}>
                                    <Icon name="alert-circle" size={18} color="#D55263" />
                                    <Text style={modalStyles.errorText}>{validationError}</Text>
                                </View>
                            )}
                            <View style={[modalStyles.buttonContainer, { backgroundColor: COLORS.surface }]}>
                                <TouchableOpacity
                                    style={[modalStyles.cancelButton, modalStyles.cancelButtonBackgroundColor]}
                                    onPress={handleCancel}
                                >
                                    <Text style={[modalStyles.cancelButtonText, modalStyles.cancelButtonTextColor]}>
                                        CANCEL
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        modalStyles.confirmButton, 
                                        { backgroundColor: COLORS.primary },
                                    ]}
                                    onPress={handleConfirm}
                                >
                                    <Text style={modalStyles.confirmButtonText}>OK</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

interface DatePickerContentProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
    colors: any;
}

const DatePickerContent: React.FC<DatePickerContentProps> = ({
    selectedDate,
    onDateChange,
    minimumDate,
    maximumDate,
    colors,
}) => {
    const styles = createStyles(colors);
    const selectedInJordan = moment(selectedDate).tz('Asia/Amman');

    const [displayYear, setDisplayYear] = useState(selectedInJordan.year());
    const [displayMonth, setDisplayMonth] = useState(selectedInJordan.month());

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (displayMonth === 0) {
                setDisplayMonth(11);
                setDisplayYear(displayYear - 1);
            } else {
                setDisplayMonth(displayMonth - 1);
            }
        } else {
            if (displayMonth === 11) {
                setDisplayMonth(0);
                setDisplayYear(displayYear + 1);
            } else {
                setDisplayMonth(displayMonth + 1);
            }
        }
    };

    const selectDate = (day: number) => {
        const currentTimeInJordan = moment(selectedDate).tz('Asia/Amman');
        const newDate = moment.tz('Asia/Amman')
            .year(displayYear)
            .month(displayMonth)
            .date(day)
            .hour(currentTimeInJordan.hour())
            .minute(currentTimeInJordan.minute())
            .second(currentTimeInJordan.second())
            .toDate();

        if (minimumDate && newDate < minimumDate) return;
        if (maximumDate && newDate > maximumDate) return;

        onDateChange(newDate);
    };

    const isDateDisabled = (day: number) => {
        const dateInJordan = moment.tz('Asia/Amman')
            .year(displayYear)
            .month(displayMonth)
            .date(day)
            .startOf('day');

        if (minimumDate) {
            const minInJordan = moment(minimumDate).tz('Asia/Amman').startOf('day');
            if (dateInJordan.isBefore(minInJordan)) return true;
        }
        if (maximumDate) {
            const maxInJordan = moment(maximumDate).tz('Asia/Amman').startOf('day');
            if (dateInJordan.isAfter(maxInJordan)) return true;
        }
        return false;
    };

    const isSelectedDate = (day: number) => {
        const selectedDateInJordan = moment(selectedDate).tz('Asia/Amman');
        return selectedDateInJordan.date() === day &&
            selectedDateInJordan.month() === displayMonth &&
            selectedDateInJordan.year() === displayYear;
    };

    const isTodayInJordan = (day: number) => {
        const todayJordan = moment.tz('Asia/Amman');
        return todayJordan.date() === day &&
            todayJordan.month() === displayMonth &&
            todayJordan.year() === displayYear;
    };

    const handleQuickSelection = (type: 'today' | 'yesterday' | 'lastWeek') => {
        const todayJordan = moment.tz('Asia/Amman');
        let newDate;

        switch (type) {
            case 'today':
                newDate = todayJordan.toDate();
                break;
            case 'yesterday':
                newDate = todayJordan.clone().subtract(1, 'day').toDate();
                break;
            case 'lastWeek':
                newDate = todayJordan.clone().subtract(7, 'days').toDate();
                break;
            default:
                newDate = todayJordan.toDate();
        }

        if (minimumDate && newDate < minimumDate) return;
        if (maximumDate && newDate > maximumDate) return;

        onDateChange(newDate);
        const jordanMoment = moment(newDate).tz('Asia/Amman');
        setDisplayYear(jordanMoment.year());
        setDisplayMonth(jordanMoment.month());
    };

    return (
        <View style={styles.newDatePickerContent}>
            <View style={[styles.dateHeader, { backgroundColor: colors.primary }]}>
                <Text style={styles.yearHeaderText}>{displayYear}</Text>
                <Text style={styles.dateHeaderText}>
                    {moment(selectedDate).tz('Asia/Amman').format('ddd, MMMM D')}
                </Text>
            </View>

            <View style={[styles.dateContent, { backgroundColor: colors.surface }]}>
                <View style={styles.newMonthHeader}>
                    <TouchableOpacity style={styles.newNavButton} onPress={() => navigateMonth('prev')}>
                        <Icon name="chevron-left" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.newMonthYearText, { color: colors.textPrimary }]}>
                        {monthNames[displayMonth]} {displayYear}
                    </Text>
                    <TouchableOpacity style={styles.newNavButton} onPress={() => navigateMonth('next')}>
                        <Icon name="chevron-right" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.newDaysHeader}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <Text key={index} style={[styles.newDayHeaderText, { color: colors.textTertiary }]}>
                            {day}
                        </Text>
                    ))}
                </View>

                <View style={styles.newCalendarGrid}>
                    {days.map((day, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.newDayCell,
                                day && isSelectedDate(day) ? [styles.newSelectedDayCell, { backgroundColor: colors.primary }] : null,
                                day && isTodayInJordan(day) && !isSelectedDate(day) ? [styles.newTodayCell, { borderColor: colors.primary }] : null,
                                day && isDateDisabled(day) ? styles.newDisabledDayCell : null,
                            ]}
                            onPress={() => day && !isDateDisabled(day) && selectDate(day)}
                            disabled={!day || isDateDisabled(day)}
                        >
                            {day && (
                                <Text
                                    style={[
                                        styles.newDayText,
                                        { color: colors.textPrimary },
                                        isSelectedDate(day) ? styles.newSelectedDayText : null,
                                        isDateDisabled(day) ? [styles.disabledTextOpacity, { color: colors.textTertiary }] : null,
                                    ]}
                                >
                                    {day}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.quickSelectionContainer}>
                    <TouchableOpacity
                        style={[styles.quickSelectionButton, { backgroundColor: colors.background }]}
                        onPress={() => handleQuickSelection('today')}
                    >
                        <Text style={[styles.quickSelectionText, { color: colors.textPrimary }]}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickSelectionButton, { backgroundColor: colors.background }]}
                        onPress={() => handleQuickSelection('yesterday')}
                    >
                        <Text style={[styles.quickSelectionText, { color: colors.textPrimary }]}>Yesterday</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.quickSelectionButton, { backgroundColor: colors.background }]}
                        onPress={() => handleQuickSelection('lastWeek')}
                    >
                        <Text style={[styles.quickSelectionText, { color: colors.textPrimary }]}>Last Week</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

interface TimePickerContentProps {
    selectedDate: Date;
    onTimeChange: (date: Date) => void;
    onValidationChange?: (isValid: boolean) => void;
    colors: any;
}

const TimePickerContent: React.FC<TimePickerContentProps> = ({
    selectedDate,
    onTimeChange,
    colors,
}) => {
    const styles = createStyles(colors);
    const [isAM, setIsAM] = useState(selectedDate.getHours() < 12);
    const [selectedHour, setSelectedHour] = useState(
        selectedDate.getHours() === 0 ? 12 :
            selectedDate.getHours() > 12 ? selectedDate.getHours() - 12 : selectedDate.getHours()
    );
    const [selectedMinute, setSelectedMinute] = useState(selectedDate.getMinutes());

    const hourScrollRef = useRef<ScrollView>(null);
    const minuteScrollRef = useRef<ScrollView>(null);
    const periodScrollRef = useRef<ScrollView>(null);

    const ITEM_HEIGHT = 55;
    const VISIBLE_ITEMS = 5;
    const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

    useEffect(() => {
        const currentHours = selectedDate.getHours();
        setIsAM(currentHours < 12);
        setSelectedHour(currentHours === 0 ? 12 : currentHours > 12 ? currentHours - 12 : currentHours);
        setSelectedMinute(selectedDate.getMinutes());
    }, [selectedDate]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const hourIndex = selectedHour === 12 ? 12 : 12 + selectedHour;
            hourScrollRef.current?.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
            minuteScrollRef.current?.scrollTo({ y: (60 + selectedMinute) * ITEM_HEIGHT, animated: false });
            periodScrollRef.current?.scrollTo({ y: (2 + (isAM ? 0 : 1)) * ITEM_HEIGHT, animated: false });
        }, 200);
        return () => clearTimeout(timer);
    }, [selectedHour, selectedMinute, isAM]);

    const updateTime = (hour: number, minute: number, ampm: boolean) => {
        const newDate = new Date(selectedDate);
        let hour24 = hour;
        if (!ampm && hour !== 12) hour24 = hour + 12;
        else if (ampm && hour === 12) hour24 = 0;
        newDate.setHours(hour24, minute, 0, 0);
        onTimeChange(newDate);
    };

    const formatDisplay = (value: number) => String(value).padStart(2, '0');
    const formatTime = (hour: number, minute: number) => `${formatDisplay(hour)}:${formatDisplay(minute)}`;

    const handleHourScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const actualIndex = index % 12;
        const newHour = actualIndex === 0 ? 12 : actualIndex;

        if (newHour !== selectedHour) {
            setSelectedHour(newHour);
            updateTime(newHour, selectedMinute, isAM);
        }
        
        if (index < 6 || index >= 24) {
            const resetIndex = newHour === 12 ? 12 : 12 + newHour;
            hourScrollRef.current?.scrollTo({ y: resetIndex * ITEM_HEIGHT, animated: false });
        }
    };

    const handleMinuteScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const actualIndex = index % 60;

        if (actualIndex !== selectedMinute) {
            setSelectedMinute(actualIndex);
            updateTime(selectedHour, actualIndex, isAM);
        }
        
        if (index < 30 || index >= 120) {
            minuteScrollRef.current?.scrollTo({ y: (60 + actualIndex) * ITEM_HEIGHT, animated: false });
        }
    };

    const handlePeriodScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        const actualIndex = index % 2;
        const newIsAM = actualIndex === 0;

        if (newIsAM !== isAM) {
            setIsAM(newIsAM);
            updateTime(selectedHour, selectedMinute, newIsAM);
        }
        
        if (index < 1 || index >= 4) {
            periodScrollRef.current?.scrollTo({ y: (2 + actualIndex) * ITEM_HEIGHT, animated: false });
        }
    };

    const baseHours = Array.from({ length: 12 }, (_, i) => i + 1);
    const baseMinutes = Array.from({ length: 60 }, (_, i) => i);
    const basePeriods = ['AM', 'PM'];
    const hours = [...baseHours, ...baseHours, ...baseHours];
    const minutes = [...baseMinutes, ...baseMinutes, ...baseMinutes];
    const periods = [...basePeriods, ...basePeriods, ...basePeriods];

    return (
        <View style={styles.newTimePickerContent}>
            <View style={[styles.timeHeader, { backgroundColor: colors.primary }]}>
                <Text style={styles.newTimeDisplayText}>{formatTime(selectedHour, selectedMinute)}</Text>
                <Text style={styles.ampmHeaderText}>{isAM ? 'AM' : 'PM'}</Text>
            </View>

            <View style={[styles.wheelPickerContainer, { backgroundColor: colors.surface }]}>
                <View style={[styles.selectionIndicator, { borderColor: colors.primary }]} pointerEvents="none" />
                <View style={styles.wheelRow}>
                    <View style={styles.wheelColumn}>
                        <ScrollView
                            ref={hourScrollRef}
                            style={[styles.wheelScroll, { height: PICKER_HEIGHT }]}
                            contentContainerStyle={[styles.wheelScrollContent, { paddingVertical: ITEM_HEIGHT * 2 }]}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={ITEM_HEIGHT}
                            decelerationRate="fast"
                            onMomentumScrollEnd={handleHourScroll}
                            onScrollEndDrag={handleHourScroll}
                        >
                            {hours.map((hour, idx) => {
                                const actualHour = ((idx % 12) === 0) ? 12 : (idx % 12);
                                return (
                                    <TouchableOpacity key={`hour-${idx}`} style={[styles.wheelItem, { height: ITEM_HEIGHT }]} activeOpacity={0.7} onPress={() => { setSelectedHour(actualHour); updateTime(actualHour, selectedMinute, isAM); }}>
                                        <Text style={[styles.wheelItemText, { color: colors.textPrimary }, actualHour === selectedHour && [styles.wheelItemTextSelected, { color: colors.primary }]]}>
                                            {formatDisplay(actualHour)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                    <Text style={[styles.wheelSeparator, { color: colors.textPrimary }]}>:</Text>
                    <View style={styles.wheelColumn}>
                        <ScrollView
                            ref={minuteScrollRef}
                            style={[styles.wheelScroll, { height: PICKER_HEIGHT }]}
                            contentContainerStyle={[styles.wheelScrollContent, { paddingVertical: ITEM_HEIGHT * 2 }]}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={ITEM_HEIGHT}
                            decelerationRate="fast"
                            onMomentumScrollEnd={handleMinuteScroll}
                            onScrollEndDrag={handleMinuteScroll}
                        >
                            {minutes.map((minute, idx) => {
                                const actualMinute = idx % 60;
                                return (
                                    <TouchableOpacity key={`minute-${idx}`} style={[styles.wheelItem, { height: ITEM_HEIGHT }]} activeOpacity={0.7} onPress={() => { setSelectedMinute(actualMinute); updateTime(selectedHour, actualMinute, isAM); }}>
                                        <Text style={[styles.wheelItemText, { color: colors.textPrimary }, actualMinute === selectedMinute && [styles.wheelItemTextSelected, { color: colors.primary }]]}>
                                            {formatDisplay(actualMinute)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                    <View style={[styles.wheelColumn, styles.periodWheelColumn]}>
                        <ScrollView
                            ref={periodScrollRef}
                            style={[styles.wheelScroll, { height: PICKER_HEIGHT }]}
                            contentContainerStyle={[styles.wheelScrollContent, { paddingVertical: ITEM_HEIGHT * 2 }]}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={ITEM_HEIGHT}
                            decelerationRate="fast"
                            onMomentumScrollEnd={handlePeriodScroll}
                            onScrollEndDrag={handlePeriodScroll}
                        >
                            {periods.map((period, idx) => {
                                const actualIndex = idx % 2;
                                const isSelected = (actualIndex === 0 && isAM) || (actualIndex === 1 && !isAM);
                                const isInCenterPosition = idx >= 2 && idx <= 3;
                                return (
                                    <TouchableOpacity key={`period-${idx}`} style={[styles.wheelItem, { height: ITEM_HEIGHT }]} activeOpacity={0.7} onPress={() => { const newIsAM = actualIndex === 0; setIsAM(newIsAM); updateTime(selectedHour, selectedMinute, newIsAM); }}>
                                        <Text style={[styles.wheelItemTextPeriod, { color: colors.textPrimary }, isSelected && isInCenterPosition && styles.wheelItemTextSelected, isSelected && isInCenterPosition && { color: colors.primary }]}>
                                            {period}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </View>
        </View>
    );
};

const createStyles = (colors: any) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        width: screenWidth * 0.85,
        maxWidth: 420,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    newDatePickerContent: {
        height: 520,
    },
    newTimePickerContent: {
        height: 400,
    },
    yearHeaderText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 18,
        fontWeight: '400',
        marginBottom: 8,
    },
    dateHeaderText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '500',
        lineHeight: 32,
    },
    dateContent: {
        flex: 1,
        padding: 24,
    },
    newMonthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    newNavButton: {
        padding: 8,
        borderRadius: 8,
    },
    newMonthYearText: {
        fontSize: 20,
        fontWeight: '600',
    },
    newDaysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    newDayHeaderText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        flex: 1,
    },
    newCalendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 32,
    },
    newDayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
    },
    newSelectedDayCell: {
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    newTodayCell: {
        borderRadius: 8,
        borderWidth: 2,
    },
    newDisabledDayCell: {
        opacity: 0.3,
    },
    newDayText: {
        fontSize: 16,
        fontWeight: '500',
    },
    newSelectedDayText: {
        color: '#fff',
        fontWeight: '600',
    },
    quickSelectionContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    quickSelectionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickSelectionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    pickerContainerError: {
        borderColor: '#D55263',
        borderWidth: 3,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#D55263',
        gap: 8,
    },
    errorText: {
        flex: 1,
        color: '#991B1B',
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonBackgroundColor: {
        backgroundColor: 'transparent',
        borderColor: '#d1d5db',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    cancelButtonTextColor: {
        color: '#4B5563',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    timeHeader: {
        paddingVertical: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newTimeDisplayText: {
        color: '#fff',
        fontSize: 56,
        fontWeight: '200',
        letterSpacing: 2,
    },
    ampmHeaderText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 24,
        fontWeight: '300',
        marginTop: 4,
    },
    wheelPickerContainer: {
        flex: 1,
        paddingVertical: 30,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    selectionIndicator: {
        position: 'absolute',
        top: 110,
        left: 30,
        right: 30,
        height: 55,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        backgroundColor: 'rgba(124, 195, 159, 0.12)',
        borderRadius: 10,
        zIndex: 1,
    },
    wheelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        zIndex: 2,
    },
    wheelColumn: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    periodWheelColumn: {
        marginLeft: 12,
    },
    wheelScroll: {
        width: 90,
    },
    wheelScrollContent: {
        alignItems: 'center',
    },
    wheelItem: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    wheelItemText: {
        fontSize: 26,
        fontWeight: '400',
        opacity: 0.35,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    wheelItemTextPeriod: {
        fontSize: 22,
        fontWeight: '400',
        opacity: 0.35,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    wheelItemTextSelected: {
        fontSize: 32,
        fontWeight: '600',
        opacity: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    wheelSeparator: {
        fontSize: 40,
        fontWeight: '300',
        marginHorizontal: 5,
        opacity: 0.5,
        marginTop: 35,
        lineHeight: 36,
        textAlignVertical: 'center',
    },
    dateHeader: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    disabledTextOpacity: {
        opacity: 0.5,
    },
});

export default CustomDateTimePicker;