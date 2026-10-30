import { fireEvent, render, screen } from '@testing-library/react-native';

import { TasksScreen } from './TasksScreen';

describe('TasksScreen', () => {
  it('renders today and tomorrow groups', () => {
    render(<TasksScreen />);

    expect(screen.getByText('待办')).toBeTruthy();
    expect(screen.getByText('今天')).toBeTruthy();
    expect(screen.getByText('明天')).toBeTruthy();
    expect(screen.getByText('完成项目方案初稿')).toBeTruthy();
    expect(screen.getByText('提交本周工作总结')).toBeTruthy();
  });

  it('shows total, done and pending counts', () => {
    render(<TasksScreen />);

    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
    expect(screen.getByText('14%')).toBeTruthy();
  });

  it('filters tasks by tag', () => {
    render(<TasksScreen />);

    fireEvent.press(screen.getByLabelText('工作'));

    expect(screen.getByText('完成项目方案初稿')).toBeTruthy();
    expect(screen.queryByText('给妈妈打个电话')).toBeNull();
  });
});
