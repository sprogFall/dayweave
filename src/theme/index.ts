import { useColorScheme } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS, type Colors } from './palette';

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
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  caption: 12,
  body: 15,
  subtitle: 17,
  title: 24,
  hero: 30,
} as const;

export type ColorScheme = 'light' | 'dark';

export function toColorScheme(value: string | null | undefined): ColorScheme {
  return value === 'dark' ? 'dark' : 'light';
}

export function useColors(): Colors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

export type { Colors };
