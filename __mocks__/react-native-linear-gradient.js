/**
 * Mock for react-native-linear-gradient
 * Used in Jest tests to avoid native module issues
 */

const React = require('react');
const { View } = require('react-native');

const LinearGradient = (props) => {
  return React.createElement(View, { ...props, testID: 'linear-gradient' }, props.children);
};

module.exports = LinearGradient;
module.exports.default = LinearGradient;
