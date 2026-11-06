import type { ComponentType } from 'react';

import { CARD_IDS, type CardId } from '@/domain/cardLayout';

import { StreakCard } from './streak/StreakCard';
import { TodayHoursCard } from './todayHours/TodayHoursCard';
import type { CardViewProps } from './types';
import { WeekSummaryCard } from './weekSummary/WeekSummaryCard';

/**
 * 卡片注册表：新增一张卡片 = 在 CARD_IDS 加 id、在 CARD_META 补文案、在这里登记组件。
 * Record<CardId, ...> 保证漏注册会直接编译失败。
 */
export const CARD_REGISTRY: Record<CardId, ComponentType<CardViewProps>> = {
  [CARD_IDS.todayHours]: TodayHoursCard,
  [CARD_IDS.weekSummary]: WeekSummaryCard,
  [CARD_IDS.streak]: StreakCard,
};
