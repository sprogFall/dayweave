import {
  MAX_MINUTES_PER_ENTRY,
  formatDuration,
  formatHours,
  parseCount,
  parseDurationInput,
  splitMinutes,
  toMinutes,
} from './duration';

describe('duration', () => {
  it('converts between hours, minutes and totals', () => {
    expect(toMinutes(2, 15)).toBe(135);
    expect(toMinutes(0, 45)).toBe(45);
    expect(splitMinutes(135)).toEqual({ hours: 2, minutes: 15 });
    expect(splitMinutes(60)).toEqual({ hours: 1, minutes: 0 });
    expect(splitMinutes(-10)).toEqual({ hours: 0, minutes: 0 });
  });

  it('formats durations in Chinese', () => {
    expect(formatDuration(0)).toBe('0 分钟');
    expect(formatDuration(45)).toBe('45 分钟');
    expect(formatDuration(60)).toBe('1 小时');
    expect(formatDuration(135)).toBe('2 小时 15 分');
    expect(formatDuration(1440)).toBe('24 小时');
  });

  it('formats hours for card headlines with at most two decimals', () => {
    expect(formatHours(0)).toBe('0');
    expect(formatHours(90)).toBe('1.5');
    expect(formatHours(135)).toBe('2.25');
    expect(formatHours(80)).toBe('1.33');
  });

  it('parses bounded non-negative integers', () => {
    expect(parseCount('45', 59)).toBe(45);
    expect(parseCount('0', 59)).toBe(0);
    expect(parseCount('', 59)).toBeNull();
    expect(parseCount('60', 59)).toBeNull();
    expect(parseCount('-1', 59)).toBeNull();
    expect(parseCount('4.5', 59)).toBeNull();
    expect(parseCount('abc', 59)).toBeNull();
  });

  it('combines the hours and minutes fields', () => {
    expect(parseDurationInput('2', '15')).toBe(135);
    expect(parseDurationInput('', '90')).toBeNull();
    expect(parseDurationInput('2', '')).toBe(120);
    expect(parseDurationInput('0', '30')).toBe(30);
    expect(parseDurationInput('', '')).toBeNull();
    expect(parseDurationInput('0', '0')).toBeNull();
    expect(parseDurationInput('24', '1')).toBeNull();
    expect(parseDurationInput('25', '0')).toBeNull();
  });

  it('caps a single entry at 24 hours', () => {
    expect(MAX_MINUTES_PER_ENTRY).toBe(1440);
    expect(parseDurationInput('24', '0')).toBe(MAX_MINUTES_PER_ENTRY);
  });
});
