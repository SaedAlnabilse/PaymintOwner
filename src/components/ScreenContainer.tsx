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
  edges = ['left', 'right'] // Default to left and right only, as headers handle the top safe area
}) => {
  const theme = useTheme() as unknown as AppTheme;
  const insets = useSafeAreaInsets();
  const barStyle = theme.dark ? "light-content" : "dark-content";

  const dynamicStyles = React.useMemo(() => ({
    backgroundColor: theme.colors.background,
  }), [theme.colors.background]);

  const manualSafeAreaStyles = React.useMemo(() => ({
    backgroundColor: theme.colors.background,
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  }), [theme.colors.background, edges, insets]);

  if (withSafeArea) {
    return (
      <SafeAreaView
        style={[styles.container, dynamicStyles, style]}
        edges={edges}
      >
        <StatusBar
          barStyle={barStyle}
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
      manualSafeAreaStyles,
      style
    ]}>
      <StatusBar
        barStyle={barStyle}
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
