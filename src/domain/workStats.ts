import type { WorkLog } from '@/types/domain';

import { WEEKDAY_LABELS, addDays, calendarDayKey, startOfDay } from './calendar';

export interface WeekDaySummary {
  /** YYYY-MM-DD，用于柱状图 key 与当天定位。 */
  key: string;
  label: string;
  minutes: number;
}

export interface WeekSummary {
  days: readonly WeekDaySummary[];
  totalMinutes: number;
  /** 有记录的周内天数，用于区分「记了 0 分钟」和「没记录」。 */
  activeDays: number;
}

/** 同一天的多条记录累加；分钟是整数，直接相加不会丢精度。 */
export function indexMinutesByDate(logs: readonly WorkLog[]): Map<string, number> {
  const index = new Map<string, number>();
  logs.forEach((log) => {
    index.set(log.date, (index.get(log.date) ?? 0) + log.minutes);
  });
  return index;
}

export function minutesOn(logs: readonly WorkLog[], date: Date): number {
  return indexMinutesByDate(logs).get(calendarDayKey(date)) ?? 0;
}

export function sumMinutes(logs: readonly WorkLog[]): number {
  return logs.reduce((total, log) => total + log.minutes, 0);
}

/** 周一为一周起点，与 WEEKDAY_LABELS 的顺序一致。 */
export function weekStartOf(date: Date): Date {
  const day = startOfDay(date);
  return addDays(day, -((day.getDay() + 6) % 7));
}

export function buildWeekSummary(logs: readonly WorkLog[], reference: Date): WeekSummary {
  const start = weekStartOf(reference);
  const index = indexMinutesByDate(logs);

  const days = WEEKDAY_LABELS.map((label, offset) => {
    const key = calendarDayKey(addDays(start, offset));
    return { key, label, minutes: index.get(key) ?? 0 };
  });

  return {
    days,
    totalMinutes: days.reduce((total, day) => total + day.minutes, 0),
    activeDays: days.filter((day) => day.minutes > 0).length,
  };
}

/**
 * 连续记录天数：当天还没记录时从昨天开始数，当天记了就从今天开始，
 * 这样用户上午打开 app 不会看到「断签」。
 */
export function countStreakDays(logs: readonly WorkLog[], today: Date): number {
  const index = indexMinutesByDate(logs);
  let cursor = startOfDay(today);
  if (!index.has(calendarDayKey(cursor))) cursor = addDays(cursor, -1);

  let streak = 0;
  while (index.has(calendarDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** 一次遍历把记录按任务分组，避免每张任务卡各自 filter 一遍。 */
export function groupLogsByTask(logs: readonly WorkLog[]): Map<string, WorkLog[]> {
  const groups = new Map<string, WorkLog[]>();
  logs.forEach((log) => {
    const bucket = groups.get(log.taskId);
    if (bucket) bucket.push(log);
    else groups.set(log.taskId, [log]);
  });
  return groups;
}

export function logsForTask(
  groups: Map<string, WorkLog[]>,
  taskId: string,
): readonly WorkLog[] {
  return groups.get(taskId) ?? [];
}

/** 任务最近一次记录日期，用于在卡片上提示「已几天没动」。 */
export function latestLogDate(logs: readonly WorkLog[]): string | null {
  return logs.reduce<string | null>(
    (latest, log) => (latest === null || log.date > latest ? log.date : latest),
    null,
  );
}
