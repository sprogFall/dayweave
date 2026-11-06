import { CARD_IDS, type CardId } from '@/domain/cardLayout';
import type { IconName, TintName } from '@/theme';

export interface CardMeta {
  title: string;
  /** 配置面板里的一句话说明。 */
  summary: string;
  icon: IconName;
  tint: TintName;
}

/**
 * 卡片的展示元信息。与组件实现分开存放，避免卡片组件反向 import 注册表造成循环依赖。
 */
export const CARD_META: Record<CardId, CardMeta> = {
  [CARD_IDS.todayHours]: {
    title: '今日工时',
    summary: '今天记了几小时，以及本周的累计进度。',
    icon: 'time-outline',
    tint: 'blue',
  },
  [CARD_IDS.weekSummary]: {
    title: '本周小结',
    summary: '本周每天的工作时长、合计与上周对比。',
    icon: 'stats-chart-outline',
    tint: 'teal',
  },
  [CARD_IDS.streak]: {
    title: '连续记录',
    summary: '连续多少天有工时记录，帮你保持节奏。',
    icon: 'flame-outline',
    tint: 'amber',
  },
};
