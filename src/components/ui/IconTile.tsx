import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTints, type IconName, type TintName } from '@/theme';

type TileSize = 'sm' | 'md' | 'lg';

interface IconTileProps {
  name: IconName;
  tint: TintName;
  size?: TileSize;
  style?: StyleProp<ViewStyle>;
}

const TILE_SIZES: Record<TileSize, { box: number; icon: number; radius: number }> = {
  sm: { box: 34, icon: 17, radius: 12 },
  md: { box: 44, icon: 21, radius: 15 },
  lg: { box: 58, icon: 27, radius: 19 },
};

export function IconTile({ name, tint, size = 'md', style }: IconTileProps) {
  const tints = useTints();
  const metrics = TILE_SIZES[size];

  return (
    <View
      style={[
        styles.base,
        {
          width: metrics.box,
          height: metrics.box,
          borderRadius: metrics.radius,
          backgroundColor: tints.bg[tint],
        },
        style,
      ]}
    >
      <Ionicons name={name} size={metrics.icon} color={tints.fg[tint]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
