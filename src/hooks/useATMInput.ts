import { useState, useCallback } from 'react';

/**
 * ATM-Style Cash Input Hook
 * 
 * Stores value as integer (cents/fils) and displays as formatted decimal.
 * This avoids floating point precision issues with money calculations.
 * 
 * Example flow:
 * - User types 5 → Store 5 → Display 0.05
 * - User types 0 → Store 50 → Display 0.50
 * - User types 0 → Store 500 → Display 5.00
 * - User hits backspace → Store 50 → Display 0.50
 */
export const useATMInput = (initialValue: number = 0) => {
  // Store value as integer (cents/fils)
  const [cents, setCents] = useState<number>(Math.round(initialValue * 100));

  // Display value formatted as decimal string
  const displayValue = (cents / 100).toFixed(2);

  // Get the actual numeric value (for calculations)
  const numericValue = cents / 100;

  // Check if value is zero (for styling)
  const isEmpty = cents === 0;

  // Handle digit input
  const handleDigit = useCallback((digit: string) => {
    if (!/^[0-9]$/.test(digit)) return;
    
    setCents(prev => {
      const newValue = prev * 10 + parseInt(digit, 10);
      // Prevent overflow (max ~21 million with safe integer)
      if (newValue > 999999999) return prev;
      return newValue;
    });
  }, []);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    setCents(prev => Math.floor(prev / 10));
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setCents(0);
  }, []);

  // Handle text change from TextInput (for keyboard input)
  const handleTextChange = useCallback((text: string) => {
    // Remove all non-digit characters
    const digitsOnly = text.replace(/[^0-9]/g, '');
    
    if (digitsOnly === '') {
      setCents(0);
      return;
    }

    // Parse the digits - this handles leading zeros correctly
    // "0" -> 0, "00" -> 0, "005" -> 5, "123" -> 123
    const newCents = parseInt(digitsOnly, 10);
    
    // Prevent overflow
    if (newCents > 999999999) return;
    
    // Always update, even if the value is 0
    // This ensures the input responds to user typing
    setCents(newCents);
  }, []);

  // Set value directly (for initialization or external updates)
  const setValue = useCallback((value: number) => {
    setCents(Math.round(value * 100));
  }, []);

  // Reset to initial value
  const reset = useCallback(() => {
    setCents(Math.round(initialValue * 100));
  }, [initialValue]);

  return {
    cents,
    displayValue,
    numericValue,
    isEmpty,
    handleDigit,
    handleBackspace,
    handleClear,
    handleTextChange,
    setValue,
    reset,
  };
};

export default useATMInput;
