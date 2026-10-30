import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors, useScreenGradient } from '@/theme';

interface ScreenProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  /** 默认使用顶部薄荷雾渐变，纯色页面可关闭。 */
  gradient?: boolean;
}

export function Screen({ children, style, gradient = true }: ScreenProps) {
  const colors = useColors();
  const gradientColors = useScreenGradient();

  if (!gradient) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView edges={['top', 'left', 'right']} style={[{ flex: 1 }, style]}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}
