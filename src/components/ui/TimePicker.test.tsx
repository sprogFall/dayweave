import { fireEvent, render, screen } from '@testing-library/react-native';

import { TimePicker } from './TimePicker';

const VALUE = { hour: 9, minute: 0 };

describe('TimePicker', () => {
  it('shows a formatted preview and both option columns', () => {
    render(<TimePicker value={VALUE} onChange={jest.fn()} />);

    expect(screen.getByText('09:00')).toBeTruthy();
    expect(screen.getByText('时')).toBeTruthy();
    expect(screen.getByText('分')).toBeTruthy();
    expect(screen.getByLabelText('小时 09').props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByLabelText('分钟 00').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('reports hour and minute changes', () => {
    const onChange = jest.fn();
    render(<TimePicker value={VALUE} onChange={onChange} minuteStep={10} />);

    fireEvent.press(screen.getByLabelText('小时 18'));
    expect(onChange).toHaveBeenLastCalledWith({ hour: 18, minute: 0 });

    fireEvent.press(screen.getByLabelText('分钟 30'));
    expect(onChange).toHaveBeenLastCalledWith({ hour: 9, minute: 30 });
  });

  it('honours the minute step', () => {
    render(<TimePicker value={VALUE} onChange={jest.fn()} minuteStep={15} />);

    expect(screen.getByLabelText('分钟 15')).toBeTruthy();
    expect(screen.getByLabelText('分钟 45')).toBeTruthy();
    expect(screen.queryByLabelText('分钟 20')).toBeNull();
  });
});
