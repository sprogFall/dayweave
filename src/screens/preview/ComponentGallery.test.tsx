import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { dismissActiveDialog, getActiveDialog } from '@/lib/dialog';
import { ComponentGallery } from './ComponentGallery';

afterEach(async () => {
  await act(async () => {
    while (getActiveDialog()) dismissActiveDialog();
  });
});

describe('ComponentGallery', () => {
  it('offers all four shared interaction components', () => {
    render(<ComponentGallery />);

    expect(screen.getByText('界面组件预览')).toBeTruthy();
    expect(screen.getByLabelText('消息弹窗')).toBeTruthy();
    expect(screen.getByLabelText('确认框')).toBeTruthy();
    expect(screen.getByLabelText('选择日期')).toBeTruthy();
    expect(screen.getByLabelText('选择时间')).toBeTruthy();
  });

  it('opens the in-app calendar instead of a native picker', () => {
    render(<ComponentGallery />);

    fireEvent.press(screen.getByLabelText('选择日期'));
    expect(getActiveDialog()?.kind).toBe('date');
    expect(getActiveDialog()?.title).toBe('选择日期');
  });

  it('opens a destructive confirmation and the time picker', async () => {
    render(<ComponentGallery />);

    fireEvent.press(screen.getByLabelText('确认框'));
    expect(getActiveDialog()?.kind).toBe('confirm');
    expect(getActiveDialog()?.destructive).toBe(true);

    await act(async () => {
      dismissActiveDialog();
    });
    fireEvent.press(screen.getByLabelText('选择时间'));
    expect(getActiveDialog()?.kind).toBe('time');
  });
});
