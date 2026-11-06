import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import type { Colors } from '@/theme';

/**
 * 标签栏内容高度。
 * React Navigation 的图标容器固定 28 高、每个 tab 上下内边距各 5，
 * 再加上标签行高 14，一共 52；默认的 49 装不下，底部文字会被裁掉一截。
 */
export const TAB_BAR_CONTENT_HEIGHT = 54;

/** 固定行高，避免 Android 字体额外行距把标签顶出可用高度。 */
export const TAB_BAR_LABEL_STYLE: TextStyle = {
  fontSize: 11,
  fontWeight: '600',
  lineHeight: 14,
  includeFontPadding: false,
};

/** 11px 小字与细线图标不用 faint，未选中态也要保持足够对比度。 */
export function getTabBarTints(colors: Colors): { active: string; inactive: string } {
  return { active: colors.primary, inactive: colors.muted };
}

/** 高度必须自己算：一旦在 style 里写死 height，库就不会再自动叠加底部安全区。 */
export function getTabBarStyle(colors: Colors, bottomInset: number): ViewStyle {
  return {
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
  };
}
