import type { Ionicons } from '@expo/vector-icons';

/** 图标名称统一收敛到主题层，避免各页面各写各的字面量。 */
export type IconName = keyof typeof Ionicons.glyphMap;
