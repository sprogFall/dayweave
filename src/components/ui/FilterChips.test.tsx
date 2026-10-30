import { fireEvent, render, screen } from '@testing-library/react-native';

import { FilterChips } from './FilterChips';

const OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'work', label: '工作' },
  { value: 'life', label: '生活' },
] as const;

describe('FilterChips', () => {
  it('renders every option', () => {
    render(<FilterChips options={OPTIONS} value="all" onChange={() => {}} />);

    expect(screen.getByText('全部')).toBeTruthy();
    expect(screen.getByText('工作')).toBeTruthy();
    expect(screen.getByText('生活')).toBeTruthy();
  });

  it('marks the selected chip for accessibility', () => {
    render(<FilterChips options={OPTIONS} value="work" onChange={() => {}} />);

    expect(screen.getByLabelText('工作').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('全部').props.accessibilityState).toEqual({ selected: false });
  });

  it('reports the pressed value once', () => {
    const onChange = jest.fn();
    render(<FilterChips options={OPTIONS} value="all" onChange={onChange} />);

    fireEvent.press(screen.getByLabelText('生活'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('life');
  });
});
