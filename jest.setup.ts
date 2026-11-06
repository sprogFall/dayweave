import { Animated } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// 测试里不跑真实计时动画，避免异步 Animated 更新产生 act 警告与不稳定时序。
jest.spyOn(Animated, 'timing').mockImplementation(
  () =>
    ({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    }) as unknown as Animated.CompositeAnimation,
);

// 应用内更新涉及的原生能力统一用离线替身，测试不访问文件系统或系统安装器。
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '0.2.0', android: { package: 'com.dayweave.app' } },
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///docs/',
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
  getInfoAsync: jest.fn(async () => ({ exists: false, uri: '', size: 0, isDirectory: false })),
  makeDirectoryAsync: jest.fn(async () => undefined),
  readDirectoryAsync: jest.fn(async () => []),
  deleteAsync: jest.fn(async () => undefined),
  getContentUriAsync: jest.fn(async (uri: string) => `content://${uri}`),
  createDownloadResumable: jest.fn(() => ({
    downloadAsync: jest.fn(async () => ({ status: 200, uri: 'file:///docs/updates/a.apk' })),
  })),
}));

jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn(async () => undefined),
}));

// 图标字体在 Jest 里无法真正加载，用同尺寸的占位视图，保留可访问性 label。
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(View, { accessibilityLabel: name }),
  };
});
