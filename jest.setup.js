// jest.setup.js
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.useSharedValue = jest.fn().mockReturnValue({ value: 0 });
  return Reanimated;
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  const actual = jest.requireActual('react-native-safe-area-context');

  const inset = { top: 0, right: 0, bottom: 0, left: 0 };

  const SafeAreaProvider = ({ children }) => (
    <actual.SafeAreaProvider initialMetrics={{ insets: inset, frame: { x: 0, y: 0, width: 0, height: 0 } }}>
      {children}
    </actual.SafeAreaProvider>
  );

  return {
    ...actual,
    SafeAreaProvider,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});