import { toShortcutItems, type ShortcutItem } from '@/components/ui/ShortcutGrid';
import { DEFAULT_SHORTCUTS } from '@/domain/toolCatalog';
import type { TintName } from '@/theme';

export interface OverviewStat {
  id: string;
  label: string;
  value: string;
  unit: string;
  tint: TintName;
}

/** 首页概览的展示数据，接入真实工时 / 待办后再由 store 提供。 */
export const PENDING_TASK_COUNT = 3;

export const OVERVIEW_STATS: readonly OverviewStat[] = [
  { id: 'hours', label: '工时', value: '7.5', unit: '小时', tint: 'blue' },
  { id: 'tasks', label: '待办', value: String(PENDING_TASK_COUNT), unit: '项', tint: 'violet' },
  { id: 'reminders', label: '提醒', value: '2', unit: '条', tint: 'amber' },
];

export const WEATHER_LABEL = '18°C 晴';

export interface WeekLog {
  day: string;
  hours: number;
}

export const WEEK_LOGS: readonly WeekLog[] = [
  { day: '一', hours: 4.5 },
  { day: '二', hours: 6 },
  { day: '三', hours: 5.5 },
  { day: '四', hours: 7 },
  { day: '五', hours: 7.5 },
  { day: '六', hours: 2 },
  { day: '日', hours: 0 },
];

export const WEEK_TOTAL_HOURS = WEEK_LOGS.reduce((total, log) => total + log.hours, 0);

export const WEEK_DELTA_HOURS = 4.5;

export const OVERVIEW_HINT = `本周已记录 ${WEEK_TOTAL_HOURS} 小时 · 还有 ${PENDING_TASK_COUNT} 项待办`;

export const TODAY_SHORTCUTS: readonly ShortcutItem[] = toShortcutItems(DEFAULT_SHORTCUTS);
