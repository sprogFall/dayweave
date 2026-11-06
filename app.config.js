/**
 * Expo 动态配置。
 * 品牌信息、包名等与具体部署有关的配置集中在这里；真实密钥只通过环境变量注入。
 */
const APP_NAME = 'Dayweave';
const APP_SLUG = 'dayweave';
const BRAND_COLOR = '#B8EED0';
const ICON_PATH = './assets/icon.png';

module.exports = {
  expo: {
    name: APP_NAME,
    slug: APP_SLUG,
    version: process.env.APP_VERSION || '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'dayweave',
    backgroundColor: '#F7FBFA',
    icon: ICON_PATH,
    plugins: [
      'expo-asset',
      'expo-font',
      [
        'expo-image-picker',
        {
          photosPermission: '允许 Dayweave 选择照片以设置个人头像。',
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
      [
        'expo-splash-screen',
        {
          image: ICON_PATH,
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#F7FBFA',
          dark: { image: ICON_PATH, backgroundColor: '#0E1413' },
        },
      ],
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dayweave.app',
    },
    android: {
      package: 'com.dayweave.app',
      versionCode: Number(process.env.ANDROID_VERSION_CODE || 1),
      // 应用内更新下载完 APK 后需要拉起系统安装器
      permissions: ['REQUEST_INSTALL_PACKAGES'],
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: BRAND_COLOR,
      },
    },
  },
};
