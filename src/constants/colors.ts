// Color System - Updated to match design specifications with Dark Mode support

export const LIGHT_COLORS = {
  // PRIMARY COLORS
  primary: '#7CC39F',        // Green - Primary brand color
  darkNavy: '#1F1D2B',       // Dark Navy - Primary text
  red: '#D55263',            // Red - Alerts, errors
  white: '#FFFFFF',          // White - Backgrounds

  // NEUTRAL & GRAPH COLORS
  neutralGray: '#A8BBBF',    // Neutral gray
  graphGray: '#737182',      // Graph/secondary gray

  // GRAYSCALE
  black: '#1F1D2B',          // Same as darkNavy
  darkGray: '#828287',       // Dark gray
  lightGray: '#D7D6D6',      // Light gray

  // SECONDARY COLORS
  containerGray: '#E8E8E8',  // Container, card color
  cancelGray: '#B1B6B9',     // Discard, cancel button
  discardText: '#808B92',    // Text in discard button
  alertYellow: '#D0C962',    // Yellow alert threshold
  alertRed: '#D55263',       // Red alert threshold (same as red)

  // BACKGROUNDS
  background: '#F8FAFC',     // Main background
  cardBackground: '#E8E8E8', // Card background
  surface: '#FFFFFF',        // Surface/card white

  // TEXT COLORS
  textPrimary: '#1F1D2B',    // Primary text
  textSecondary: '#737182',  // Secondary text
  textTertiary: '#828287',   // Tertiary text

  // STATUS COLORS
  success: '#7CC39F',        // Success (same as primary)
  successBg: '#D1FAE5',      // Success background
  successText: '#059669',    // Success text
  error: '#D55263',          // Error (same as red)
  errorBg: '#FEE2E2',        // Error background
  errorText: '#DC2626',      // Error text
  warning: '#D0C962',        // Warning (same as alertYellow)
  warningBg: '#FEF3C7',      // Warning background

  // BORDERS
  border: '#E2E8F0',         // Border color
  borderLight: '#E8E8E8',    // Light border

  // ADDITIONAL COLORS
  orange: '#F59E0B',         // Orange
  teal: '#14B8A6',           // Teal
  blue: '#3B82F6',           // Blue
  purple: '#8B5CF6',         // Purple
  
  // EXTRA UI COLORS
  badgeBg: '#EEF2FF',        // Badge background
  cardBg: '#F1F5F9',         // Card background
  
  // ALIASES FOR BACKWARDS COMPATIBILITY
  green: '#7CC39F',          // Alias for primary
  yellow: '#D0C962',         // Alias for alertYellow
  gray: '#808B92',           // Alias for discardText
  purpleGray: '#737182',     // Alias for graphGray
  blueGray: '#A8BBBF',       // Alias for neutralGray
};

export const DARK_COLORS = {
  // PRIMARY COLORS
  primary: '#81C784',        // Desaturated Green (easier on eyes)
  darkNavy: '#FFFFFF',       // High emphasis text
  red: '#EF4444',            // Brighter red for dark mode
  white: '#1E1E1E',          // Surface color

  // NEUTRAL & GRAPH COLORS
  neutralGray: '#94A3B8',    // Lighter neutral gray
  graphGray: '#94A3B8',      // Lighter graph gray

  // GRAYSCALE
  black: '#FFFFFF',          // White text
  darkGray: '#B0B3B8',       // Medium emphasis (70% white)
  lightGray: '#2F2F2F',      // Border color

  // SECONDARY COLORS
  containerGray: '#2F2F2F',  // Subtle border/container
  cancelGray: '#718096',     // Lighter cancel
  discardText: '#B0B3B8',    // Medium emphasis text
  alertYellow: '#F59E0B',    // Brighter yellow
  alertRed: '#EF4444',       // Brighter red

  // BACKGROUNDS
  background: '#121212',     // Material Design standard dark background
  cardBackground: '#2F2F2F', // Border/subtle container
  surface: '#1E1E1E',        // Lighter grey for Cards/Headers

  // TEXT COLORS
  textPrimary: '#FFFFFF',    // High emphasis - Pure white
  textSecondary: '#B0B3B8',  // Medium emphasis (70% white)
  textTertiary: '#808B92',   // Low emphasis

  // STATUS COLORS
  success: '#81C784',        // Desaturated green
  successBg: '#1B332D',      // Deep forest green background
  successText: '#E0F2F1',    // Off-white/mint tint
  error: '#EF4444',          // Brighter red
  errorBg: '#3D1F1F',        // Dark red background
  errorText: '#FCA5A5',      // Light red text
  warning: '#F59E0B',        // Brighter yellow
  warningBg: '#3D2F1F',      // Dark yellow background

  // BORDERS
  border: '#2F2F2F',         // Very subtle border
  borderLight: '#2F2F2F',    // Same subtle border

  // ADDITIONAL COLORS
  orange: '#FB923C',         // Brighter orange
  teal: '#2DD4BF',           // Brighter teal
  blue: '#64B5F6',           // Light blue
  purple: '#A78BFA',         // Brighter purple
  
  // EXTRA UI COLORS
  badgeBg: 'rgba(129, 195, 132, 0.15)', // Transparent green
  cardBg: '#1E1E1E',         // Surface color
  
  // ALIASES FOR BACKWARDS COMPATIBILITY
  green: '#81C784',          // Desaturated green
  yellow: '#F59E0B',         // Alias for warning (brighter)
  gray: '#B0B3B8',           // Medium emphasis
  purpleGray: '#94A3B8',     // Alias for graphGray
  blueGray: '#94A3B8',       // Alias for neutralGray
};

// Default export for backward compatibility
export const COLORS = LIGHT_COLORS;

// Function to get colors based on theme
export const getColors = (isDarkMode: boolean) => {
  return isDarkMode ? DARK_COLORS : LIGHT_COLORS;
};
