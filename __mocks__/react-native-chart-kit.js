/**
 * Mock for react-native-chart-kit
 * Used in Jest tests to avoid native module issues
 */

const React = require('react');
const { View } = require('react-native');

const createChartMock = (name) => (props) => {
  return React.createElement(View, { ...props, testID: name }, props.children);
};

module.exports = {
  LineChart: createChartMock('line-chart'),
  BarChart: createChartMock('bar-chart'),
  PieChart: createChartMock('pie-chart'),
  ProgressChart: createChartMock('progress-chart'),
  ContributionGraph: createChartMock('contribution-graph'),
  StackedBarChart: createChartMock('stacked-bar-chart'),
};
