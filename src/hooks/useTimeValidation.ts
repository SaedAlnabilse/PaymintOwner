import { useCallback } from 'react';
import moment from 'moment-timezone';

interface TimeValidationResult {
  isValid: boolean;
  message: string | null;
  type: 'error' | 'warning' | 'success';
}

interface UseTimeValidationProps {
  onValidationError?: (result: TimeValidationResult) => void;
  onValidationWarning?: (result: TimeValidationResult) => void;
  allowOvernight?: boolean;
}

export const useTimeValidation = ({
  onValidationError,
  onValidationWarning,
  allowOvernight = true,
}: UseTimeValidationProps = {}) => {
  const validateRange = useCallback(
    (startDate: Date, startTime: Date, endDate: Date, endTime: Date): TimeValidationResult => {
      const start = moment(startDate).set({
        hour: startTime.getHours(),
        minute: startTime.getMinutes(),
      });
      
      const end = moment(endDate).set({
        hour: endTime.getHours(),
        minute: endTime.getMinutes(),
      });

      // Case 1: Start time is after End time
      if (start.isAfter(end)) {
        const result: TimeValidationResult = {
          isValid: false,
          message: 'Start time cannot be after end time',
          type: 'error',
        };
        onValidationError?.(result);
        return result;
      }

      // Case 2: Overnight shift warning
      // If the range spans across midnight (e.g., 10 PM to 2 AM next day)
      if (allowOvernight && !start.isSame(end, 'day')) {
        const result: TimeValidationResult = {
          isValid: true,
          message: 'This range spans overnight',
          type: 'warning',
        };
        onValidationWarning?.(result);
        return result;
      }

      return {
        isValid: true,
        message: null,
        type: 'success',
      };
    },
    [allowOvernight, onValidationError, onValidationWarning]
  );

  return {
    validateRange,
  };
};
