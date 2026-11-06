/**
 * 工时统一以分钟为存储单位：整型，累计不产生浮点误差，也避免「0.1 小时」这种输入。
 * 只在展示和表单回填时换算成小时 / 分钟。
 */

export const MINUTES_PER_HOUR = 60;
export const MAX_HOURS_PER_ENTRY = 24;
export const MAX_MINUTES_PER_ENTRY = MAX_HOURS_PER_ENTRY * MINUTES_PER_HOUR;

export function toMinutes(hours: number, minutes: number): number {
  return hours * MINUTES_PER_HOUR + minutes;
}

/** 拆分分钟数为小时与分钟，用于表单回填。 */
export function splitMinutes(total: number): { hours: number; minutes: number } {
  const safe = Math.max(0, Math.trunc(total));
  return { hours: Math.floor(safe / MINUTES_PER_HOUR), minutes: safe % MINUTES_PER_HOUR };
}

/** 中文时长文案：「2 小时 15 分」「3 小时」「45 分钟」。 */
export function formatDuration(total: number): string {
  const { hours, minutes } = splitMinutes(total);
  if (hours === 0) return `${minutes} 分钟`;
  if (minutes === 0) return `${hours} 小时`;
  return `${hours} 小时 ${minutes} 分`;
}

/** 卡片大字用的小时数，保留两位小数并去掉尾部的 0。 */
export function formatHours(totalMinutes: number): string {
  const hours = Math.round((Math.max(0, totalMinutes) / MINUTES_PER_HOUR) * 100) / 100;
  return String(hours);
}

/** 解析非负整数输入；空串、非数字或超过上限都返回 null。 */
export function parseCount(text: string, max: number): number | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  if (!/^\d{1,5}$/.test(trimmed)) return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value > max) return null;
  return value;
}

/**
 * 校验小时 / 分钟输入 → 分钟。两个框都空视为无效，
 * 小时允许 0，但合计必须大于 0。
 */
export function parseDurationInput(
  hoursText: string,
  minutesText: string,
): number | null {
  const hoursRaw = hoursText.trim();
  const minutesRaw = minutesText.trim();
  if (hoursRaw.length === 0 && minutesRaw.length === 0) return null;

  const hours = hoursRaw.length === 0 ? 0 : parseCount(hoursRaw, MAX_HOURS_PER_ENTRY);
  if (hours === null) return null;

  const minutes = minutesRaw.length === 0 ? 0 : parseCount(minutesRaw, MINUTES_PER_HOUR - 1);
  if (minutes === null) return null;

  const total = toMinutes(hours, minutes);
  if (total <= 0 || total > MAX_MINUTES_PER_ENTRY) return null;
  return total;
}
