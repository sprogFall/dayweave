import { formatDateLabel, greetingFor } from './datetime';

describe('greetingFor', () => {
  it('greets by day part', () => {
    expect(greetingFor(0)).toBe('夜深了');
    expect(greetingFor(5)).toBe('夜深了');
    expect(greetingFor(6)).toBe('早上好');
    expect(greetingFor(11)).toBe('早上好');
    expect(greetingFor(12)).toBe('下午好');
    expect(greetingFor(17)).toBe('下午好');
    expect(greetingFor(18)).toBe('晚上好');
    expect(greetingFor(23)).toBe('晚上好');
  });
});

describe('formatDateLabel', () => {
  it('formats month, day and weekday', () => {
    expect(formatDateLabel(new Date(2025, 3, 25))).toBe('4月25日 周五');
    expect(formatDateLabel(new Date(2025, 0, 1))).toBe('1月1日 周三');
  });
});
