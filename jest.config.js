module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-redux|immer|react-native-drawer-layout|react-native-worklets|react-native-vector-icons|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-keychain|react-native-fs|react-native-linear-gradient|react-native-chart-kit|react-native-svg|react-native-image-picker|@notifee)/)',
  ],
  moduleNameMapper: {
    'react-native-keychain': '<rootDir>/__mocks__/react-native-keychain.js',
    'react-native-fs': '<rootDir>/__mocks__/react-native-fs.js',
    'react-native-linear-gradient': '<rootDir>/__mocks__/react-native-linear-gradient.js',
    'react-native-chart-kit': '<rootDir>/__mocks__/react-native-chart-kit.js',
    'react-native-image-picker': '<rootDir>/__mocks__/react-native-image-picker.js',
    '@notifee/react-native': '<rootDir>/__mocks__/@notifee/react-native.js',
  },
};
