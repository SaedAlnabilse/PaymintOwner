import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';

import store from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalErrorBoundary from './src/components/common/GlobalErrorBoundary';
import { getTheme } from './src/theme/theme';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { pushNotificationService } from './src/services/pushNotificationService';
import { backgroundNotificationService } from './src/services/backgroundNotificationService';
import { useAppStartup } from './src/hooks/useAppStartup';

function AppContent() {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);
  
  // Initialize app settings (API URL)
  useAppStartup();

  // Initialize push notifications and background service
  useEffect(() => {
    const initializeServices = async () => {
      await pushNotificationService.configure();
      await pushNotificationService.requestPermissions();
      
      // Initialize background notification checking
      await backgroundNotificationService.initialize();
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      backgroundNotificationService.stop();
    };
  }, []);

  return (
    <PaperProvider theme={theme as any}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.colors.background}
          translucent={false}
        />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

import { StyleSheet } from 'react-native';

function App() {
  return (
    <GlobalErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <Provider store={store}>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </Provider>
      </GestureHandlerRootView>
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;