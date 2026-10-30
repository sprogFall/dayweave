import { render, screen } from '@testing-library/react-native';

import { ProfileScreen } from './ProfileScreen';

jest.mock('@/services/profile.service', () => ({
  getMyProfile: jest.fn(),
}));

describe('ProfileScreen', () => {
  it('shows the signed-out shell with menu entries', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('我的')).toBeTruthy();
    expect(screen.getByText('未设置昵称')).toBeTruthy();
    expect(screen.getByText('未绑定邮箱')).toBeTruthy();
    expect(screen.getByText('数据统计')).toBeTruthy();
    expect(screen.getByText('帮助与反馈')).toBeTruthy();
    expect(screen.getByLabelText('退出登录')).toBeTruthy();
  });
});
