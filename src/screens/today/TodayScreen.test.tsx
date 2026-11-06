import { fireEvent, render, screen } from '@testing-library/react-native';

import { CARD_IDS } from '@/domain/cardLayout';
import { useCardLayoutStore } from '@/stores/cardLayout.store';

import { TodayScreen } from './TodayScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@/services/workTask.service', () => ({
  listWorkTasks: jest.fn(async () => []),
  createWorkTask: jest.fn(),
  updateWorkTask: jest.fn(),
  setWorkTaskDone: jest.fn(),
  deleteWorkTask: jest.fn(),
}));

jest.mock('@/services/workLog.service', () => ({
  listWorkLogs: jest.fn(async () => []),
  createWorkLog: jest.fn(),
  deleteWorkLog: jest.fn(),
}));

describe('TodayScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    useCardLayoutStore.getState().reset();
  });

  it('renders the greeting and the default cards', () => {
    render(<TodayScreen />);

    expect(screen.getByText(/早上好|下午好|晚上好|夜深了/)).toBeTruthy();
    expect(screen.getByText('我的卡片')).toBeTruthy();
    expect(screen.getByText('今日工时')).toBeTruthy();
    expect(screen.getByText('本周小结')).toBeTruthy();
    expect(screen.getByText('常用工具')).toBeTruthy();
  });

  it('shows real work hours instead of demo numbers', () => {
    render(<TodayScreen />);

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getByText('今天还没有记录，点右上角记一笔。')).toBeTruthy();
  });

  it('opens the work hours page from a shortcut', () => {
    render(<TodayScreen />);

    fireEvent.press(screen.getByLabelText('工时记录'));

    expect(mockNavigate).toHaveBeenCalledWith('WorkHours');
  });

  it('jumps to the tools tab from the shortcut header', () => {
    render(<TodayScreen />);

    fireEvent.press(screen.getByLabelText('常用工具 全部'));

    expect(mockNavigate).toHaveBeenCalledWith('Tabs', { screen: 'Tools' });
  });

  it('enters edit mode and removes a card', () => {
    render(<TodayScreen />);

    fireEvent.press(screen.getByLabelText('我的卡片 配置'));

    expect(screen.getByLabelText('移除「本周小结」')).toBeTruthy();
    expect(screen.getByText('可添加的卡片')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('移除「本周小结」'));

    expect(screen.queryByLabelText('移除「本周小结」')).toBeNull();
    expect(useCardLayoutStore.getState().layouts.today).toEqual([CARD_IDS.todayHours]);
  });

  it('adds a card back from the edit panel', () => {
    render(<TodayScreen />);

    fireEvent.press(screen.getByLabelText('我的卡片 配置'));
    fireEvent.press(screen.getByLabelText('添加卡片 连续记录'));

    expect(screen.getByText('连续记录')).toBeTruthy();
    expect(useCardLayoutStore.getState().layouts.today).toContain(CARD_IDS.streak);
  });
});
