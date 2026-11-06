import { render, screen } from '@testing-library/react-native';

import { useCardLayoutStore } from '@/stores/cardLayout.store';

import { ProfileScreen } from './ProfileScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@/services/profile.service', () => ({
  getMyProfile: jest.fn(async () => ({
    id: 'user-1',
    displayName: '阿澈',
    avatarUrl: null,
    createdAt: '',
    updatedAt: '',
  })),
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

describe('ProfileScreen', () => {
  beforeEach(() => {
    useCardLayoutStore.getState().reset();
  });

  it('shows the signed-out shell with menu entries', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('我的')).toBeTruthy();
    expect(screen.getByText('未设置昵称')).toBeTruthy();
    expect(screen.getByText('未绑定邮箱')).toBeTruthy();
    expect(screen.getByText('数据统计')).toBeTruthy();
    expect(screen.getByText('帮助与反馈')).toBeTruthy();
    expect(screen.getByLabelText('退出登录')).toBeTruthy();
  });

  it('renders the configurable card board with the profile defaults', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('我的数据')).toBeTruthy();
    expect(screen.getByText('本周小结')).toBeTruthy();
    expect(screen.getByText('连续记录')).toBeTruthy();
    expect(screen.getByLabelText('我的数据 配置')).toBeTruthy();
  });
});
