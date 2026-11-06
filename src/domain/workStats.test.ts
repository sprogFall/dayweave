import type { WorkLog } from '@/types/domain';

import { calendarDayKey } from './calendar';
import {
  buildWeekSummary,
  countStreakDays,
  groupLogsByTask,
  indexMinutesByDate,
  latestLogDate,
  logsForTask,
  minutesOn,
  sumMinutes,
  weekStartOf,
} from './workStats';

function log(date: Date, minutes: number, taskId = 'task-1'): WorkLog {
  return {
    id: `${taskId}-${calendarDayKey(date)}-${minutes}`,
    taskId,
    content: '',
    minutes,
    date: calendarDayKey(date),
    createdAt: '2026-11-06T00:00:00.000Z',
    updatedAt: '2026-11-06T00:00:00.000Z',
  };
}

// 2026-11-06 是周五，所在周为 11-02（周一）到 11-08（周日）。
const FRIDAY = new Date(2026, 10, 6, 9, 0);

describe('workStats', () => {
  it('starts the week on Monday', () => {
    expect(calendarDayKey(weekStartOf(FRIDAY))).toBe('2026-11-02');
    expect(calendarDayKey(weekStartOf(new Date(2026, 10, 2)))).toBe('2026-11-02');
    expect(calendarDayKey(weekStartOf(new Date(2026, 10, 8, 23, 59)))).toBe('2026-11-02');
  });

  it('aggregates several logs on the same day', () => {
    const index = indexMinutesByDate([
      log(new Date(2026, 10, 6), 90),
      log(new Date(2026, 10, 6), 45, 'task-2'),
    ]);

    expect(index.get('2026-11-06')).toBe(135);
    expect(minutesOn([log(new Date(2026, 10, 6), 60)], FRIDAY)).toBe(60);
    expect(minutesOn([], FRIDAY)).toBe(0);
  });

  it('sums minutes across logs', () => {
    expect(sumMinutes([log(FRIDAY, 30), log(FRIDAY, 45)])).toBe(75);
    expect(sumMinutes([])).toBe(0);
  });

  it('builds a seven-day week summary', () => {
    const summary = buildWeekSummary(
      [log(new Date(2026, 10, 2), 240), log(new Date(2026, 10, 6), 390)],
      FRIDAY,
    );

    expect(summary.days.map((day) => day.label)).toEqual(['一', '二', '三', '四', '五', '六', '日']);
    expect(summary.days.map((day) => day.minutes)).toEqual([240, 0, 0, 0, 390, 0, 0]);
    expect(summary.days[0].key).toBe('2026-11-02');
    expect(summary.days[6].key).toBe('2026-11-08');
    expect(summary.totalMinutes).toBe(630);
    expect(summary.activeDays).toBe(2);
  });

  it('ignores rows outside the reference week', () => {
    const summary = buildWeekSummary(
      [log(new Date(2026, 9, 30), 480), log(new Date(2026, 10, 9), 180)],
      FRIDAY,
    );

    expect(summary.totalMinutes).toBe(0);
    expect(summary.activeDays).toBe(0);
  });

  it('counts consecutive days, tolerating a missing entry for today', () => {
    const logs = [
      log(new Date(2026, 10, 6), 60),
      log(new Date(2026, 10, 5), 60),
      log(new Date(2026, 10, 4), 60),
      log(new Date(2026, 10, 2), 60),
    ];

    expect(countStreakDays(logs, FRIDAY)).toBe(3);
    expect(countStreakDays(logs, new Date(2026, 10, 5))).toBe(2);
    expect(countStreakDays([], FRIDAY)).toBe(0);
  });

  it('counts from today when today already has a record', () => {
    expect(countStreakDays([log(new Date(2026, 10, 6), 60), log(new Date(2026, 10, 5), 60)], FRIDAY)).toBe(2);
  });

  it('groups logs by task once and reads them back', () => {
    const groups = groupLogsByTask([
      log(new Date(2026, 10, 6), 60, 'task-1'),
      log(new Date(2026, 10, 5), 30, 'task-2'),
      log(new Date(2026, 10, 4), 45, 'task-1'),
    ]);

    expect(logsForTask(groups, 'task-1')).toHaveLength(2);
    expect(logsForTask(groups, 'task-2')).toHaveLength(1);
    expect(logsForTask(groups, 'missing')).toEqual([]);
  });

  it('reports the latest log date', () => {
    expect(
      latestLogDate([log(new Date(2026, 10, 1), 60), log(new Date(2026, 10, 6), 60)]),
    ).toBe('2026-11-06');
    expect(latestLogDate([])).toBeNull();
  });
});
