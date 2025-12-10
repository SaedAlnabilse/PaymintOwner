import React from 'react';
import { View, StyleSheet, StatusBar, ViewStyle, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTheme } from '../theme/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  withSafeArea?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({ 
  children, 
  style, 
  withSafeArea = true,
  edges = ['top', 'left', 'right'] // Default to top, left, right (not bottom for tab navigation)
}) => {
  const theme = useTheme() as unknown as AppTheme;
  const insets = useSafeAreaInsets();
  
  if (withSafeArea) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: theme.colors.background }, style]}
        edges={edges}
      >
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={theme.colors.background}
          translucent={Platform.OS === 'android'}
        />
        {children}
      </SafeAreaView>
    );
  }

  // Manual safe area handling when withSafeArea is false
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.background,
        paddingTop: edges.includes('top') ? insets.top : 0,
        paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
        paddingLeft: edges.includes('left') ? insets.left : 0,
        paddingRight: edges.includes('right') ? insets.right : 0,
      }, 
      style
    ]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.background}
        translucent={Platform.OS === 'android'}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
