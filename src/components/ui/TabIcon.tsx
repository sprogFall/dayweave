import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { radius, useColors, useTints, type IconName, type TintName } from '@/theme';

interface TabIconAppearance {
  label: string;
  active: IconName;
  inactive: IconName;
  tint: TintName;
}

/** 与页面内 IconTile 用同一套马卡龙色，让每个 Tab 有自己的视觉身份。 */
const TAB_ICONS: Record<string, TabIconAppearance> = {
  Today: { label: '今天', active: 'today', inactive: 'today-outline', tint: 'mint' },
  Tools: { label: '工具', active: 'grid', inactive: 'grid-outline', tint: 'blue' },
  Tasks: { label: '待办', active: 'checkbox', inactive: 'checkbox-outline', tint: 'amber' },
  Profile: { label: '我的', active: 'person', inactive: 'person-outline', tint: 'violet' },
  Gallery: {
    label: '组件预览',
    active: 'color-palette',
    inactive: 'color-palette-outline',
    tint: 'teal',
  },
};

const FALLBACK: TabIconAppearance = {
  label: '标签',
  active: 'ellipse',
  inactive: 'ellipse-outline',
  tint: 'mint',
};

/** React Navigation 的图标容器固定 28 高，色块不额外撑高标签栏。 */
const TILE_SIZE = 28;
const GLYPH_SIZE = 17;

interface TabIconProps {
  name: string;
  focused: boolean;
}

export function TabIcon({ name, focused }: TabIconProps) {
  const colors = useColors();
  const tints = useTints();
  const appearance = TAB_ICONS[name] ?? FALLBACK;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={appearance.label}
      accessibilityState={{ selected: focused }}
      style={[
        styles.tile,
        { backgroundColor: focused ? tints.bg[appearance.tint] : 'transparent' },
      ]}
    >
      <Ionicons
        name={focused ? appearance.active : appearance.inactive}
        size={GLYPH_SIZE}
        color={focused ? tints.fg[appearance.tint] : colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
