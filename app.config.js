/**
 * Expo 动态配置。
 * 品牌信息、包名等与具体部署有关的配置集中在这里；真实密钥只通过环境变量注入。
 */
const APP_NAME = 'Dayweave';
const APP_SLUG = 'dayweave';
const BRAND_COLOR = '#2CAE73';

module.exports = {
  expo: {
    name: APP_NAME,
    slug: APP_SLUG,
    version: process.env.APP_VERSION || '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'dayweave',
    backgroundColor: '#F7FBFA',
    plugins: ['expo-asset'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.dayweave.app',
    },
    android: {
      package: 'com.dayweave.app',
      versionCode: Number(process.env.ANDROID_VERSION_CODE || 1),
      adaptiveIcon: {
        backgroundColor: BRAND_COLOR,
      },
    },
  },
};
