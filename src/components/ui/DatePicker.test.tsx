import { fireEvent, render, screen } from '@testing-library/react-native';

import { DatePicker } from './DatePicker';

const VALUE = new Date(2026, 10, 6);

describe('DatePicker', () => {
  it('renders a Monday-first month with weekday labels', () => {
    render(<DatePicker value={VALUE} onChange={jest.fn()} />);

    expect(screen.getByText('2026年11月')).toBeTruthy();
    expect(screen.getByText('一')).toBeTruthy();
    expect(screen.getByText('日')).toBeTruthy();
    expect(screen.getByLabelText('2026年11月1日')).toBeTruthy();
    expect(screen.getByLabelText('2026年11月30日')).toBeTruthy();
  });

  it('marks the selected day and reports a new selection', () => {
    const onChange = jest.fn();
    render(<DatePicker value={VALUE} onChange={onChange} />);

    expect(screen.getByLabelText('2026年11月6日').props.accessibilityState).toMatchObject({
      selected: true,
    });

    fireEvent.press(screen.getByLabelText('2026年11月9日'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as Date).getDate()).toBe(9);
    expect((onChange.mock.calls[0][0] as Date).getMonth()).toBe(10);
  });

  it('navigates between months', () => {
    render(<DatePicker value={VALUE} onChange={jest.fn()} />);

    fireEvent.press(screen.getByLabelText('上个月'));
    expect(screen.getByText('2026年10月')).toBeTruthy();
    expect(screen.getByLabelText('2026年10月6日')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('下个月'));
    expect(screen.getByText('2026年11月')).toBeTruthy();
  });

  it('disables out-of-range days and blocks month navigation past the bounds', () => {
    const onChange = jest.fn();
    render(
      <DatePicker
        value={VALUE}
        onChange={onChange}
        minDate={new Date(2026, 10, 3)}
        maxDate={new Date(2026, 10, 20)}
      />,
    );

    const outOfRange = screen.getByLabelText('2026年11月2日');
    expect(outOfRange.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(outOfRange);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('上个月'));
    expect(screen.getByText('2026年11月')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('下个月'));
    expect(screen.getByText('2026年11月')).toBeTruthy();
  });

  it('highlights an injected today without treating it as the selection', () => {
    render(<DatePicker value={VALUE} onChange={jest.fn()} today={new Date(2026, 10, 8)} />);

    expect(screen.getByLabelText('2026年11月8日').props.accessibilityState).toMatchObject({
      selected: false,
    });
    expect(screen.getByLabelText('2026年11月6日').props.accessibilityState).toMatchObject({
      selected: true,
    });
  });
});
