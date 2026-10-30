import { fireEvent, render, screen } from '@testing-library/react-native';

import { ToolsScreen } from './ToolsScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('ToolsScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('lists every tool with its summary', () => {
    render(<ToolsScreen />);

    expect(screen.getByText('我的常用')).toBeTruthy();
    expect(screen.getAllByText('工时记录').length).toBeGreaterThan(0);
    expect(screen.getByText('按天登记工作时段，月底自动汇总。')).toBeTruthy();
    expect(screen.getByText('习惯打卡')).toBeTruthy();
  });

  it('filters the list by keyword', () => {
    render(<ToolsScreen />);

    fireEvent.changeText(screen.getByLabelText('搜索工具名称'), '工时');

    expect(screen.getAllByText('工时记录').length).toBeGreaterThan(0);
    expect(screen.queryByText('习惯打卡')).toBeNull();
  });

  it('shows an empty state when nothing matches', () => {
    render(<ToolsScreen />);

    fireEvent.changeText(screen.getByLabelText('搜索工具名称'), '量子计算');

    expect(screen.getByText('没有找到匹配的工具，换个关键词试试。')).toBeTruthy();
  });

  it('filters by category chip', () => {
    render(<ToolsScreen />);

    fireEvent.press(screen.getByLabelText('出行'));

    expect(screen.getAllByText('出行助手').length).toBeGreaterThan(0);
    expect(screen.queryByText('习惯打卡')).toBeNull();
  });

  it('opens the placeholder page for the selected tool', () => {
    render(<ToolsScreen />);

    fireEvent.press(screen.getByLabelText('习惯打卡'));

    expect(mockNavigate).toHaveBeenCalledWith('ToolDetail', { toolId: 'habit' });
  });
});
