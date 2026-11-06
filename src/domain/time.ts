export interface TimeValue {
  hour: number;
  minute: number;
}

export const DEFAULT_TIME: TimeValue = { hour: 9, minute: 0 };
export const DEFAULT_MINUTE_STEP = 5;
export const HOURS_PER_DAY = 24;
export const MINUTES_PER_HOUR = 60;

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function normalizeTime(value: TimeValue): TimeValue {
  return {
    hour: clamp(value.hour, 0, HOURS_PER_DAY - 1),
    minute: clamp(value.minute, 0, MINUTES_PER_HOUR - 1),
  };
}

export function formatTime(value: TimeValue): string {
  return `${pad2(value.hour)}:${pad2(value.minute)}`;
}

export function hourOptions(): readonly number[] {
  return Array.from({ length: HOURS_PER_DAY }, (_, index) => index);
}

/** step 收敛到 1..60，保证列表至少有一项且不会无限循环。 */
export function minuteOptions(step: number): readonly number[] {
  const normalized = clamp(step, 1, MINUTES_PER_HOUR);
  const options: number[] = [];
  for (let minute = 0; minute < MINUTES_PER_HOUR; minute += normalized) {
    options.push(minute);
  }
  return options;
}
