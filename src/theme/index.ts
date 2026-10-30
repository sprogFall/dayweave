import { useColorScheme } from 'react-native';

import {
  DARK_COLORS,
  DARK_TINTS,
  LIGHT_COLORS,
  LIGHT_TINTS,
  type Colors,
  type TintName,
  type TintSet,
} from './palette';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  caption: 12,
  label: 13,
  body: 15,
  subtitle: 17,
  title: 24,
  display: 26,
  hero: 30,
} as const;

export type ColorScheme = 'light' | 'dark';

export function toColorScheme(value: string | null | undefined): ColorScheme {
  return value === 'dark' ? 'dark' : 'light';
}

function useScheme(): ColorScheme {
  return toColorScheme(useColorScheme());
}

export function useColors(): Colors {
  return useScheme() === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

export function useTints(): TintSet {
  return useScheme() === 'dark' ? DARK_TINTS : LIGHT_TINTS;
}

/** 页面顶部的薄雾渐变：浅色为薄荷白，深色为深松绿。 */
export function useScreenGradient(): readonly [string, string, string] {
  return useScheme() === 'dark'
    ? (['#16251F', '#0E1413', '#0E1413'] as const)
    : (['#E8F6EF', '#F4FBF8', '#F7FBFA'] as const);
}

/** 主色渐变，用于头像、悬浮按钮等需要体积感的位置。 */
export function usePrimaryGradient(): readonly [string, string] {
  return useScheme() === 'dark'
    ? (['#6ED3A2', '#3FAF7C'] as const)
    : (['#45C489', '#22A468'] as const);
}

/** 卡片投影：浅色下是极淡的绿灰，深色下靠边框区分层次。 */
export function useCardShadow(): {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
} {
  const scheme = useScheme();
  return {
    shadowColor: scheme === 'dark' ? DARK_COLORS.shadow : LIGHT_COLORS.shadow,
    shadowOpacity: scheme === 'dark' ? 0 : 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: scheme === 'dark' ? 0 : 2,
  };
}

export type { IconName } from './icons';
export type { Colors, TintName, TintSet };
