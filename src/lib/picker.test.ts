import { getActiveDialog, resolveActiveDialog } from './dialog';
import { pickDate, pickTime } from './picker';

const FIXED_DAY = new Date(2026, 10, 6);

afterEach(() => {
  const request = getActiveDialog();
  if (request) resolveActiveDialog(request.id, null);
});

describe('picker facade', () => {
  it('opens a date dialog with an injected initial day and inclusive bounds', async () => {
    const pending = pickDate({
      initial: FIXED_DAY,
      min: new Date(2026, 10, 1),
      max: new Date(2026, 10, 30),
    });
    const request = getActiveDialog();

    expect(request?.kind).toBe('date');
    expect(request?.title).toBe('选择日期');
    expect(request?.initialDate).toBe(FIXED_DAY);
    expect(request?.minDate).toEqual(new Date(2026, 10, 1));
    expect(request?.maxDate).toEqual(new Date(2026, 10, 30));
    expect(request?.confirmText).toBe('确定');
    expect(request?.cancelText).toBe('取消');

    const chosen = new Date(2026, 10, 9);
    resolveActiveDialog(request?.id ?? -1, chosen);
    expect(await pending).toBe(chosen);
  });

  it('opens a time dialog with a five-minute step and custom copy', async () => {
    const pending = pickTime({
      initial: { hour: 18, minute: 30 },
      minuteStep: 10,
      title: '提醒时间',
      confirmText: '设定',
    });
    const request = getActiveDialog();

    expect(request?.kind).toBe('time');
    expect(request?.title).toBe('提醒时间');
    expect(request?.initialTime).toEqual({ hour: 18, minute: 30 });
    expect(request?.minuteStep).toBe(10);
    expect(request?.confirmText).toBe('设定');

    const chosen = { hour: 20, minute: 0 };
    resolveActiveDialog(request?.id ?? -1, chosen);
    expect(await pending).toEqual(chosen);
  });

  it('uses the default step when none is supplied', () => {
    const pending = pickTime();

    const request = getActiveDialog();
    expect(request?.title).toBe('选择时间');
    expect(request?.minuteStep).toBe(5);
    expect(request?.initialTime).toBeUndefined();

    resolveActiveDialog(request?.id ?? -1, null);
    return pending;
  });
});
