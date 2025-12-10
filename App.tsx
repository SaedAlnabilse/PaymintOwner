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

function AppContent() {
  const { isDarkMode } = useTheme();
  const theme = getTheme(isDarkMode);

  // Initialize push notifications
  useEffect(() => {
    pushNotificationService.configure();
    pushNotificationService.requestPermissions();
  }, []);

  return (
    <PaperProvider theme={theme as any}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle={isDarkMode ? "light-content" : "dark-content"}
            backgroundColor={theme.colors.background}
          />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </Provider>
      </GestureHandlerRootView>
    </GlobalErrorBoundary>
  );
}

export default App;