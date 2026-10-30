import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, useCardShadow, useColors } from '@/theme';

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  /** muted 用于卡片内嵌的次级区域，例如搜索框所在的浅底块。 */
  tone?: 'surface' | 'muted';
  padded?: boolean;
}

export function Card({ children, style, tone = 'surface', padded = true }: CardProps) {
  const colors = useColors();
  const shadow = useCardShadow();

  return (
    <View
      style={[
        styles.base,
        shadow,
        {
          backgroundColor: tone === 'muted' ? colors.cardMuted : colors.card,
          borderColor: colors.border,
          padding: padded ? spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
