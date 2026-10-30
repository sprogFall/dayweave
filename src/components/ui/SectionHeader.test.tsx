import { fireEvent, render, screen } from '@testing-library/react-native';

import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('renders the section title', () => {
    render(<SectionHeader title="今日概览" />);

    expect(screen.getByText('今日概览')).toBeTruthy();
  });

  it('keeps the action hidden unless a handler is provided', () => {
    const { rerender } = render(<SectionHeader title="常用工具" />);
    expect(screen.queryByText('全部')).toBeNull();

    rerender(<SectionHeader title="常用工具" actionLabel="全部" onAction={() => {}} />);
    expect(screen.getByText('全部')).toBeTruthy();
  });

  it('calls the action handler when pressed', () => {
    const onAction = jest.fn();
    render(<SectionHeader title="常用工具" actionLabel="全部" onAction={onAction} />);

    fireEvent.press(screen.getByLabelText('常用工具 全部'));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
