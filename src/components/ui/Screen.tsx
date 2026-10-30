import type { PropsWithChildren } from 'react';
import { SafeAreaView, type ViewStyle } from 'react-native';

import { useColors } from '@/theme';

interface ScreenProps extends PropsWithChildren {
  style?: ViewStyle;
}

export function Screen({ children, style }: ScreenProps) {
  const colors = useColors();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, style]}>
      {children}
    </SafeAreaView>
  );
}
