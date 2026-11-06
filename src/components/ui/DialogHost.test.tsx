import { fireEvent, render, screen } from '@testing-library/react-native';

import { formatCalendarDay } from '@/domain/calendar';
import { dismissActiveDialog, enqueueDialog, getActiveDialog } from '@/lib/dialog';
import { DialogHost } from './DialogHost';

afterEach(() => {
  while (getActiveDialog()) dismissActiveDialog();
});

describe('DialogHost', () => {
  it('renders a message dialog and resolves on its only action', async () => {
    const pending = enqueueDialog<void>({ kind: 'message', title: '提示', message: '内容说明' });
    render(<DialogHost />);

    expect(screen.getByText('提示')).toBeTruthy();
    expect(screen.getByText('内容说明')).toBeTruthy();
    expect(screen.getByLabelText('知道了')).toBeTruthy();
    expect(screen.queryByLabelText('取消')).toBeNull();

    fireEvent.press(screen.getByLabelText('知道了'));
    await expect(pending).resolves.toBeUndefined();
  });

  it('renders a destructive confirmation and resolves true', async () => {
    const pending = enqueueDialog<boolean>({
      kind: 'confirm',
      title: '退出登录？',
      message: '本机登录状态会被清除。',
      confirmText: '退出',
      destructive: true,
    });
    render(<DialogHost />);

    expect(screen.getByLabelText('warning-outline')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('退出'));
    expect(await pending).toBe(true);
  });

  it('dismisses a confirmation through the backdrop', async () => {
    const pending = enqueueDialog<boolean>({ kind: 'confirm', title: '确定吗？' });
    render(<DialogHost />);

    fireEvent.press(screen.getByLabelText('关闭弹窗'));
    expect(await pending).toBe(false);
  });

  it('returns the day chosen in the in-app calendar', async () => {
    const pending = enqueueDialog<Date | null>({
      kind: 'date',
      title: '选择日期',
      initialDate: new Date(2026, 10, 6),
    });
    render(<DialogHost />);

    expect(screen.getByText('2026年11月')).toBeTruthy();
    expect(screen.getByText('已选 2026年11月6日')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('2026年11月9日'));
    expect(screen.getByText('已选 2026年11月9日')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('确定'));

    const chosen = await pending;
    expect(chosen).not.toBeNull();
    expect(formatCalendarDay(chosen as Date)).toBe('2026年11月9日');
  });

  it('returns the time chosen in the in-app time picker', async () => {
    const pending = enqueueDialog<{ hour: number; minute: number } | null>({
      kind: 'time',
      title: '选择时间',
      initialTime: { hour: 9, minute: 0 },
      minuteStep: 10,
    });
    render(<DialogHost />);

    expect(screen.getByText('已选 09:00')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('小时 18'));
    fireEvent.press(screen.getByLabelText('分钟 30'));
    expect(screen.getByText('已选 18:30')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('确定'));

    expect(await pending).toEqual({ hour: 18, minute: 30 });
  });
});
