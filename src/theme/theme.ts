export const lightTheme = {
  dark: false,
  colors: {
    primary: '#7CC39F', // Green - Primary brand, success, cash
    primaryDark: '#6BA888',
    secondary: '#737182', // Purple-Gray - Card Sales
    accent: '#D0C962', // Yellow - Attention, Hours Worked
    background: '#F8FAFC', // Main Background (Light Gray/White)
    surface: '#FFFFFF', // White Surface
    error: '#D55263', // Red - Alerts, refunds, errors
    text: '#1F1D2B', // Dark Navy - Primary text
    textSecondary: '#828287', // Gray - Secondary text
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1F1D2B',
    onSurface: '#1F1D2B',
    border: '#E8E8E8', // Container Gray
    notification: '#D55263',
    success: '#7CC39F',
    card: '#FFFFFF',
    cardShadow: 'rgba(31, 29, 43, 0.05)',
    
    // Specific Category Colors
    categoryCard: '#737182',
    categoryCash: '#7CC39F',
    categoryOrders: '#A8BBBF', // Blue-Gray
    categoryRefunds: '#D55263',
    categoryHours: '#D0C962',
    categoryOther: '#808B92',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      color: '#1F1D2B',
    },
    h2: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1F1D2B',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1F1D2B',
    },
    body1: {
      fontSize: 16,
      color: '#1F1D2B',
    },
    body2: {
      fontSize: 14,
      color: '#828287',
    },
    caption: {
      fontSize: 12,
      color: '#828287',
    },
  },
  roundness: 16,
};

export const darkTheme = {
  dark: true,
  colors: {
    primary: '#81C784', // Desaturated Green (easier on eyes)
    primaryDark: '#5A9A7A',
    secondary: '#94A3B8', // Lighter Purple-Gray
    accent: '#F59E0B', // Brighter Yellow
    background: '#121212', // Material Design standard dark background
    surface: '#1E1E1E', // Lighter grey for Cards/Headers
    error: '#EF4444', // Brighter red
    text: '#FFFFFF', // High emphasis - Pure white
    textSecondary: '#B0B3B8', // Medium emphasis (approx 70% white)
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    border: '#2F2F2F', // Very subtle border for separation
    notification: '#EF4444',
    success: '#81C784',
    card: '#1E1E1E',
    cardShadow: 'rgba(0, 0, 0, 0.25)',
    
    // Specific Category Colors (desaturated for dark mode)
    categoryCard: '#A78BFA', // Brighter purple
    categoryCash: '#81C784', // Desaturated green
    categoryOrders: '#64B5F6', // Light blue
    categoryRefunds: '#EF4444', // Brighter red
    categoryHours: '#FB923C', // Brighter orange
    categoryOther: '#2DD4BF', // Brighter teal
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      color: '#F7FAFC',
    },
    h2: {
      fontSize: 24,
      fontWeight: '700',
      color: '#F7FAFC',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: '#F7FAFC',
    },
    body1: {
      fontSize: 16,
      color: '#F7FAFC',
    },
    body2: {
      fontSize: 14,
      color: '#CBD5E0',
    },
    caption: {
      fontSize: 12,
      color: '#CBD5E0',
    },
  },
  roundness: 16,
};

export const theme = lightTheme; // Default export for backward compatibility

export type AppTheme = typeof lightTheme;

export const getTheme = (isDarkMode: boolean): AppTheme => {
  return isDarkMode ? darkTheme : lightTheme;
};
