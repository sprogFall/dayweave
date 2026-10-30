import { fireEvent, render, screen } from '@testing-library/react-native';

import { TodayScreen } from './TodayScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('TodayScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the greeting, overview and section titles', () => {
    render(<TodayScreen />);

    expect(screen.getByText(/早上好|下午好|晚上好|夜深了/)).toBeTruthy();
    expect(screen.getByText('今日概览')).toBeTruthy();
    expect(screen.getByText('常用工具')).toBeTruthy();
    expect(screen.getByText('本周小结')).toBeTruthy();
  });

  it('shows the overview metrics', () => {
    render(<TodayScreen />);

    expect(screen.getAllByText('7.5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('小时').length).toBeGreaterThan(0);
    expect(screen.getByText('项')).toBeTruthy();
  });

  it('opens the placeholder page for a shortcut tool', () => {
    render(<TodayScreen />);

    fireEvent.press(screen.getByLabelText('工时记录'));

    expect(mockNavigate).toHaveBeenCalledWith('ToolDetail', { toolId: 'work-hours' });
  });

  it('jumps to the tools tab from the shortcut header', () => {
    render(<TodayScreen />);

    fireEvent.press(screen.getByLabelText('常用工具 全部'));

    expect(mockNavigate).toHaveBeenCalledWith('Tabs', { screen: 'Tools' });
  });
});
