module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-redux|immer|react-native-drawer-layout|react-native-worklets|react-native-vector-icons|react-native-gesture-handler|react-native-reanimated|react-native-screens)/)',
  ],
};
