import {
  DEFAULT_TIME,
  formatTime,
  hourOptions,
  minuteOptions,
  normalizeTime,
  pad2,
} from './time';

describe('time', () => {
  it('pads and formats a time value', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(9)).toBe('09');
    expect(pad2(59)).toBe('59');
    expect(formatTime({ hour: 9, minute: 5 })).toBe('09:05');
    expect(formatTime({ hour: 0, minute: 0 })).toBe('00:00');
    expect(formatTime({ hour: 23, minute: 59 })).toBe('23:59');
    expect(DEFAULT_TIME).toEqual({ hour: 9, minute: 0 });
  });

  it('normalizes out-of-range and fractional values', () => {
    expect(normalizeTime({ hour: -3, minute: -1 })).toEqual({ hour: 0, minute: 0 });
    expect(normalizeTime({ hour: 30, minute: 90 })).toEqual({ hour: 23, minute: 59 });
    expect(normalizeTime({ hour: 9.8, minute: 30.6 })).toEqual({ hour: 9, minute: 30 });
  });

  it('builds hour and minute option lists', () => {
    const hours = hourOptions();
    expect(hours).toHaveLength(24);
    expect(hours[0]).toBe(0);
    expect(hours[23]).toBe(23);

    expect(minuteOptions(5)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    expect(minuteOptions(1)).toHaveLength(60);
    expect(minuteOptions(0)).toHaveLength(60);
    expect(minuteOptions(7)[1]).toBe(7);
    expect(minuteOptions(100)).toEqual([0]);
  });
});
