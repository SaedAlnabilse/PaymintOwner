import React from 'react';
import { View, StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTheme } from '../theme/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  withSafeArea?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({ 
  children, 
  style, 
  withSafeArea = true 
}) => {
  const theme = useTheme() as unknown as AppTheme;
  
  const Container = withSafeArea ? SafeAreaView : View;

  return (
    <Container style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.background} 
      />
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
