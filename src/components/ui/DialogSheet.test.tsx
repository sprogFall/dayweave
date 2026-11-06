import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DialogSheet } from './DialogSheet';

describe('DialogSheet', () => {
  let onDismiss: jest.Mock;
  let onCancel: jest.Mock;
  let onConfirm: jest.Mock;
  let actions: Array<{ label: string; onPress: jest.Mock; variant?: 'ghost' | 'danger' }>;

  beforeEach(() => {
    onDismiss = jest.fn();
    onCancel = jest.fn();
    onConfirm = jest.fn();
    actions = [
      { label: '取消', onPress: onCancel, variant: 'ghost' },
      { label: '退出', onPress: onConfirm, variant: 'danger' },
    ];
  });

  it('shows the shared dialog chrome and custom content when visible', () => {
    render(
      <DialogSheet
        visible
        title="退出登录？"
        message="本机登录状态会被清除。"
        icon="warning-outline"
        tint="rose"
        onDismiss={onDismiss}
        actions={actions}
      >
        <Text>自定义内容</Text>
      </DialogSheet>,
    );

    expect(screen.getByText('退出登录？')).toBeTruthy();
    expect(screen.getByText('本机登录状态会被清除。')).toBeTruthy();
    expect(screen.getByLabelText('warning-outline')).toBeTruthy();
    expect(screen.getByText('自定义内容')).toBeTruthy();
    expect(screen.getByLabelText('取消')).toBeTruthy();
    expect(screen.getByLabelText('退出')).toBeTruthy();
  });

  it('wires action buttons to their callbacks', () => {
    render(
      <DialogSheet
        visible
        title="确认"
        icon="help-circle-outline"
        tint="mint"
        onDismiss={onDismiss}
        actions={actions}
      />,
    );

    fireEvent.press(screen.getByLabelText('取消'));
    fireEvent.press(screen.getByLabelText('退出'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('dismisses when the backdrop is tapped', () => {
    render(
      <DialogSheet
        visible
        title="提示"
        icon="information-circle-outline"
        tint="mint"
        onDismiss={onDismiss}
        actions={actions}
      />,
    );

    fireEvent.press(screen.getByLabelText('关闭弹窗'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('hides its content when not visible', () => {
    render(
      <DialogSheet
        visible={false}
        title="隐藏的标题"
        icon="information-circle-outline"
        tint="mint"
        onDismiss={onDismiss}
        actions={actions}
      />,
    );

    expect(screen.queryByText('隐藏的标题')).toBeNull();
  });
});
