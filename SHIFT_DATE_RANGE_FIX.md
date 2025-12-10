# Shift Date Range Filter Fix

## Problem
When filtering by shift, only today's shifts were showing regardless of the selected date range (Last 7 Days, Last 30 Days, etc.).

## Root Cause
The `fetchShiftsList` function had incomplete dependencies in its `useCallback`. It depended on `getDateRange`, but didn't include the underlying date/range state variables that `getDateRange` depends on.

### Before:
```typescript
const fetchShiftsList = useCallback(async () => {
  if (!selectedEmployee) {
    setShifts([]);
    return;
  }
  const { startDate, endDate } = getDateRange();
  // ... fetch shifts
}, [selectedEmployee, getDateRange]); // ❌ Missing date dependencies
```

**Issue:** When `selectedRange` changed (e.g., from "today" to "last30"), the `fetchShiftsList` callback didn't update because it wasn't tracking those dependencies.

## Solution
Added all date-related dependencies to the `fetchShiftsList` callback:

```typescript
const fetchShiftsList = useCallback(async () => {
  if (!selectedEmployee) {
    setShifts([]);
    return;
  }
  const { startDate, endDate } = getDateRange();
  // ... fetch shifts
}, [
  selectedEmployee, 
  selectedRange,      // ✅ Added
  startDate,          // ✅ Added
  endDate,            // ✅ Added
  startTime,          // ✅ Added
  endTime,            // ✅ Added
  getDateRange
]);
```

## How It Works Now

1. **User selects date range** (e.g., "Last 30 Days")
   - `setSelectedRange('last30')` is called
   
2. **State updates trigger callback**
   - `selectedRange` changes
   - `fetchShiftsList` callback detects dependency change
   
3. **useEffect runs**
   - `useEffect(() => { fetchShiftsList(); }, [fetchShiftsList])` executes
   
4. **Shifts are fetched**
   - `getDateRange()` returns correct date range (30 days ago to today)
   - `fetchEmployeeShifts()` is called with correct dates
   - Shifts for the full 30-day period are displayed

## Date Range Logic

The `getDateRange()` function correctly handles all ranges:

- **Today**: Start of today → End of today
- **Last 7 Days**: 7 days ago → Today
- **Last 30 Days**: 30 days ago → Today
- **This Month**: Start of month → Today
- **Custom**: User-selected start/end dates with times

## Result

✅ Selecting "Last 30 Days" now shows all shifts from the past 30 days
✅ Selecting "Last 7 Days" shows shifts from the past 7 days
✅ Selecting "This Month" shows shifts from the start of the month
✅ Custom date ranges work with selected dates and times
✅ Changing date range automatically refetches shifts

## Technical Note

This is a common React hooks pattern issue. When using `useCallback` with functions that depend on other state, you must include ALL transitive dependencies, not just the immediate function dependencies.

**Rule:** If callback A depends on function B, and function B depends on state C, then callback A must list both B and C in its dependency array.
