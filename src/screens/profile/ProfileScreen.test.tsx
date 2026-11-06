import { render, screen } from '@testing-library/react-native';

import { useCardLayoutStore } from '@/stores/cardLayout.store';

import { ProfileScreen } from './ProfileScreen';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const mockIdentity = {
  userId: null,
  profile: null as { displayName: string; avatarUrl: string | null } | null,
  families: [], members: {}, loading: false, error: null,
  load: jest.fn(), saveProfile: jest.fn(), renameFamily: jest.fn(),
};

jest.mock('@/stores/identity.store', () => ({
  useIdentityStore: (selector: (state: typeof mockIdentity) => unknown) => selector(mockIdentity),
}), { virtual: true });

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
    mockIdentity.profile = null;
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

  it('renders the identity store profile and shared family section', () => {
    mockIdentity.profile = { displayName: '共享昵称', avatarUrl: null };
    render(<ProfileScreen />);
    expect(screen.getByText('共享昵称')).toBeTruthy();
    expect(screen.getByText('共享家庭')).toBeTruthy();
    expect(screen.getByLabelText('刷新共享资料')).toBeTruthy();
    expect(mockIdentity.load).not.toHaveBeenCalled();
  });

  it('renders the configurable card board with the profile defaults', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('我的数据')).toBeTruthy();
    expect(screen.getByText('本周小结')).toBeTruthy();
    expect(screen.getByText('连续记录')).toBeTruthy();
    expect(screen.getByLabelText('我的数据 配置')).toBeTruthy();
  });
});
