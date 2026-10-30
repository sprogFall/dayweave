import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashView } from '@/components/SplashView';
import { AuthNavigator, MainNavigator } from '@/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { LIGHT_COLORS, DARK_COLORS } from '@/theme/palette';
import { toColorScheme, useColors } from '@/theme';

export default function App() {
  const status = useAuthStore((state) => state.status);
  const scheme = toColorScheme(useColorScheme());
  const colors = useColors();

  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.bg,
        card: colors.card,
        border: colors.border,
        primary: colors.primary,
        text: colors.text,
      },
    };
  }, [colors, scheme]);

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        {status === 'loading' ? <SplashView /> : status === 'signedIn' ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// 导出调色板便于测试与调试，不参与运行时逻辑。
export { DARK_COLORS, LIGHT_COLORS };
