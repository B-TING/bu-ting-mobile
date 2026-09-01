const React = require('react');
const { View } = require('react-native');

const MockIcon = React.forwardRef((props, ref) =>
  React.createElement(View, { ...props, ref, testID: props.testID ?? 'lucide-icon' }),
);

MockIcon.displayName = 'LucideIcon';

module.exports = new Proxy(
  { __esModule: true, default: MockIcon },
  {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      return MockIcon;
    },
  },
);
