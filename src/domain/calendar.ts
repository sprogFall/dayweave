import { pad2 } from './time';

/** 周一为一周起点，与中文日历习惯一致。 */
export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;

export const CALENDAR_WEEKS = 6;
export const DAYS_PER_WEEK = WEEKDAY_LABELS.length;

export interface CalendarDay {
  date: Date;
  inMonth: boolean;
  key: string;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** 月份切换统一落在 1 号，避免 31 号在短月里溢出到下个月。 */
export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function calendarDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 固定 6 行，月份切换时日历高度不跳动。 */
export function buildMonthGrid(year: number, month: number): readonly (readonly CalendarDay[])[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % DAYS_PER_WEEK;
  const cursor = new Date(year, month, 1 - firstWeekday);
  const weeks: CalendarDay[][] = [];

  for (let week = 0; week < CALENDAR_WEEKS; week += 1) {
    const row: CalendarDay[] = [];
    for (let day = 0; day < DAYS_PER_WEEK; day += 1) {
      row.push({
        date: new Date(cursor),
        inMonth: cursor.getFullYear() === year && cursor.getMonth() === month,
        key: calendarDayKey(cursor),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(row);
  }

  return weeks;
}

export function isSameCalendarDay(left: Date, right: Date): boolean {
  return calendarDayKey(left) === calendarDayKey(right);
}

export function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function formatCalendarDay(date: Date): string {
  return `${formatYearMonth(date)}${date.getDate()}日`;
}

export function isWithinRange(date: Date, min?: Date, max?: Date): boolean {
  const day = startOfDay(date).getTime();
  if (min && day < startOfDay(min).getTime()) return false;
  if (max && day > startOfDay(max).getTime()) return false;
  return true;
}
