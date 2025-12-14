/**
 * Centralized Timezone Utility for Paymint Application
 * 
 * This utility ensures all date/time operations use the Jordan timezone (Asia/Amman)
 * to prevent issues where the app shows the wrong date due to UTC vs local time differences.
 * 
 * Jordan is UTC+3, so when it's after midnight in Jordan (e.g., Dec 13, 1 AM),
 * UTC time is still the previous day (e.g., Dec 12, 10 PM).
 * 
 * ALWAYS use these functions instead of raw `new Date()` or `format(new Date(), ...)` calls.
 */
import moment from 'moment-timezone';
import { format as dateFnsFormat } from 'date-fns';

// Jordan's timezone
export const JORDAN_TIMEZONE = 'Asia/Amman';

/**
 * Get the current date/time in Jordan timezone
 * Use this instead of `new Date()` when you need the current time
 */
export const getNowInJordan = (): moment.Moment => {
    return moment.tz(JORDAN_TIMEZONE);
};

/**
 * Get today's date in Jordan timezone as a JavaScript Date object
 */
export const getTodayInJordan = (): Date => {
    return getNowInJordan().toDate();
};

/**
 * Get start of today in Jordan timezone
 */
export const getStartOfTodayInJordan = (): Date => {
    return getNowInJordan().startOf('day').toDate();
};

/**
 * Get end of today in Jordan timezone
 */
export const getEndOfTodayInJordan = (): Date => {
    return getNowInJordan().endOf('day').toDate();
};

/**
 * Format a date using Jordan timezone
 * Use this instead of `format(new Date(), pattern)` calls
 * 
 * @param date - Optional date to format. If not provided, uses current time in Jordan
 * @param pattern - date-fns compatible format pattern (e.g., 'EEEE, d MMM yyyy')
 */
export const formatInJordan = (date?: Date | string | null, pattern: string = 'EEEE, d MMM yyyy'): string => {
    const momentDate = date
        ? moment.tz(date, JORDAN_TIMEZONE)
        : getNowInJordan();

    // Convert to JS Date and use date-fns format for compatibility
    // But ensure we're working with Jordan's local representation
    const jordanDate = momentDate.toDate();

    // Create a date that represents the Jordan local time
    // This is needed because date-fns format() uses local system timezone
    const jordanOffset = momentDate.utcOffset(); // in minutes
    const systemOffset = new Date().getTimezoneOffset(); // in minutes (negative for positive offsets)
    const offsetDiff = jordanOffset + systemOffset; // difference in minutes

    const adjustedDate = new Date(jordanDate.getTime() + offsetDiff * 60 * 1000);

    return dateFnsFormat(adjustedDate, pattern);
};

/**
 * Format current date in Jordan timezone
 * Shorthand for formatInJordan with current time
 */
export const formatCurrentDateInJordan = (pattern: string = 'EEEE, d MMM yyyy'): string => {
    return formatInJordan(undefined, pattern);
};

/**
 * Get a moment object in Jordan timezone from any date input
 */
export const toJordanMoment = (date?: Date | string | null): moment.Moment => {
    if (!date) return getNowInJordan();
    return moment.tz(date, JORDAN_TIMEZONE);
};

/**
 * Check if a date is today in Jordan timezone
 */
export const isTodayInJordan = (date: Date | string): boolean => {
    const jordanNow = getNowInJordan();
    const jordanDate = moment.tz(date, JORDAN_TIMEZONE);
    return jordanDate.isSame(jordanNow, 'day');
};

/**
 * Get current ISO string with Jordan timezone context
 * Useful for API calls where you want to log Jordan-based time
 */
export const getJordanISOString = (): string => {
    return getNowInJordan().toISOString();
};

/**
 * Format time ago relative to Jordan timezone
 */
export const timeAgoInJordan = (date: Date | string): string => {
    return moment.tz(date, JORDAN_TIMEZONE).fromNow();
};
