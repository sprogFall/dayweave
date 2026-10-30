jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// 图标字体在 Jest 里无法真正加载，用同尺寸的占位视图，保留可访问性 label。
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(View, { accessibilityLabel: name }),
  };
});
