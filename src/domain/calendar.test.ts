import {
  WEEKDAY_LABELS,
  addMonths,
  buildMonthGrid,
  calendarDayKey,
  formatCalendarDay,
  formatYearMonth,
  isSameCalendarDay,
  isWithinRange,
  startOfDay,
} from './calendar';

describe('calendar', () => {
  it('generates six Monday-first rows for a month', () => {
    const grid = buildMonthGrid(2026, 10);

    expect(grid).toHaveLength(6);
    grid.forEach((week) => expect(week).toHaveLength(7));
    expect(WEEKDAY_LABELS).toEqual(['一', '二', '三', '四', '五', '六', '日']);
    expect(formatCalendarDay(grid[0][0].date)).toBe('2026年10月26日');
    expect(grid[0][0].inMonth).toBe(false);
    expect(formatCalendarDay(grid[0][6].date)).toBe('2026年11月1日');
    expect(grid[0][6].inMonth).toBe(true);
    expect(grid[5][6].inMonth).toBe(false);
  });

  it('keeps every day of the target month exactly once', () => {
    const days = buildMonthGrid(2026, 10)
      .flat()
      .filter((cell) => cell.inMonth);

    expect(days).toHaveLength(30);
    expect(formatCalendarDay(days[0].date)).toBe('2026年11月1日');
    expect(formatCalendarDay(days[29].date)).toBe('2026年11月30日');
    expect(new Set(days.map((cell) => cell.key)).size).toBe(30);
  });

  it('includes the leap day in February 2024', () => {
    const days = buildMonthGrid(2024, 1).flat().filter((cell) => cell.inMonth);

    expect(days).toHaveLength(29);
    expect(formatCalendarDay(days[28].date)).toBe('2024年2月29日');
  });

  it('moves across year boundaries without overflowing the day', () => {
    expect(formatCalendarDay(addMonths(new Date(2026, 11, 1), 1))).toBe('2027年1月1日');
    expect(formatCalendarDay(addMonths(new Date(2026, 0, 1), -1))).toBe('2025年12月1日');
    expect(formatCalendarDay(addMonths(new Date(2026, 5, 15), 3))).toBe('2026年9月1日');
  });

  it('compares and formats calendar days', () => {
    expect(isSameCalendarDay(new Date(2026, 10, 6, 8, 30), new Date(2026, 10, 6, 23, 59))).toBe(true);
    expect(isSameCalendarDay(new Date(2026, 10, 6), new Date(2026, 10, 7))).toBe(false);
    expect(formatYearMonth(new Date(2026, 10, 6))).toBe('2026年11月');
    expect(calendarDayKey(new Date(2026, 10, 6))).toBe('2026-11-06');
  });

  it('clears the clock and checks inclusive date ranges', () => {
    const cleared = startOfDay(new Date(2026, 10, 6, 18, 45, 12, 500));
    expect([cleared.getHours(), cleared.getMinutes(), cleared.getSeconds(), cleared.getMilliseconds()]).toEqual([
      0, 0, 0, 0,
    ]);

    const day = new Date(2026, 10, 6);
    const min = new Date(2026, 10, 1);
    const max = new Date(2026, 10, 30);
    expect(isWithinRange(day, min, max)).toBe(true);
    expect(isWithinRange(min, min, max)).toBe(true);
    expect(isWithinRange(new Date(2026, 9, 31), min, max)).toBe(false);
    expect(isWithinRange(new Date(2026, 11, 1), min, max)).toBe(false);
    expect(isWithinRange(day)).toBe(true);
  });
});
