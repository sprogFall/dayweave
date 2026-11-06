import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { Profile } from '@/types/domain';

import { SharedIdentityCard } from './SharedIdentityCard';

const mockIdentity = {
  userId: 'user-1' as string | null,
  profile: { id: 'user-1', displayName: '阿澈', avatarUrl: 'https://example.com/me.png', createdAt: '', updatedAt: '' } as Profile | null,
  families: [{ id: 'family-1', name: '我们的家', ownerId: 'user-1', createdAt: '' }],
  members: { 'family-1': [{ familyId: 'family-1', userId: 'user-2', role: 'member', displayName: '小林', avatarUrl: 'https://example.com/member.png' }] },
  loading: false,
  error: null as string | null,
  fetchedAt: null,
  load: jest.fn(async () => {}),
  saveProfile: jest.fn(async (_patch: { displayName?: string; avatarUrl?: string | null }) => {}),
  renameFamily: jest.fn(async (_id: string, _name: string) => {}),
};

jest.mock('@/stores/identity.store', () => ({
  useIdentityStore: (selector: (state: typeof mockIdentity) => unknown) => selector(mockIdentity),
}), { virtual: true });

describe('SharedIdentityCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIdentity.userId = 'user-1';
    mockIdentity.profile = { id: 'user-1', displayName: '阿澈', avatarUrl: 'https://example.com/me.png', createdAt: '', updatedAt: '' };
    mockIdentity.families = [{ id: 'family-1', name: '我们的家', ownerId: 'user-1', createdAt: '' }];
    mockIdentity.loading = false;
    mockIdentity.error = null;
  });

  it('shows shared profile, image, families and member identities without initializing again', () => {
    render(<SharedIdentityCard />);
    expect(screen.getByText('阿澈')).toBeTruthy();
    expect(screen.getByLabelText('我的头像').props.source).toEqual({ uri: 'https://example.com/me.png' });
    expect(screen.getByText('我们的家')).toBeTruthy();
    expect(screen.getByText('小林')).toBeTruthy();
    expect(screen.getByLabelText('小林的头像').props.source).toEqual({ uri: 'https://example.com/member.png' });
    expect(screen.getByText('资料缓存一天，可手动刷新。')).toBeTruthy();
    expect(mockIdentity.load).not.toHaveBeenCalled();
  });

  it('manually forces refresh and keeps stale data visible while loading or in error', async () => {
    const { rerender } = render(<SharedIdentityCard />);
    fireEvent.press(screen.getByLabelText('刷新共享资料'));
    await waitFor(() => expect(mockIdentity.load).toHaveBeenCalledWith({ force: true }));
    mockIdentity.loading = true;
    mockIdentity.error = '读取失败，请重试';
    rerender(<SharedIdentityCard />);
    expect(screen.getByText('正在刷新共享资料…')).toBeTruthy();
    expect(screen.getByText('读取失败，请重试')).toBeTruthy();
    expect(screen.getByText('阿澈')).toBeTruthy();
    expect(screen.getByText('我们的家')).toBeTruthy();
  });

  it('edits name and avatar URL inline, trimming values and allowing avatar removal', async () => {
    render(<SharedIdentityCard />);
    fireEvent.press(screen.getByLabelText('编辑个人资料'));
    expect(screen.getByText('可填公开图片链接，留空可移除头像。')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('昵称'), ' 新昵称 ');
    fireEvent.changeText(screen.getByLabelText('头像 URL'), ' https://example.com/new.png ');
    fireEvent.press(screen.getByLabelText('保存个人资料'));
    await waitFor(() => expect(mockIdentity.saveProfile).toHaveBeenCalledWith({ displayName: '新昵称', avatarUrl: 'https://example.com/new.png' }));
    await waitFor(() => expect(screen.queryByLabelText('保存个人资料')).toBeNull());
    fireEvent.press(screen.getByLabelText('编辑个人资料'));
    fireEvent.changeText(screen.getByLabelText('头像 URL'), '  ');
    fireEvent.press(screen.getByLabelText('保存个人资料'));
    await waitFor(() => expect(mockIdentity.saveProfile).toHaveBeenLastCalledWith({ displayName: '阿澈', avatarUrl: null }));
  });

  it('keeps the editor open with a useful message after save fails', async () => {
    mockIdentity.saveProfile.mockRejectedValueOnce(new Error('保存失败'));
    render(<SharedIdentityCard />);
    fireEvent.press(screen.getByLabelText('编辑个人资料'));
    fireEvent.press(screen.getByLabelText('保存个人资料'));
    expect(await screen.findByText('保存失败')).toBeTruthy();
    expect(screen.getByLabelText('昵称')).toBeTruthy();
  });

  it('rejects non-web avatar URLs without saving and lets the user cancel', () => {
    render(<SharedIdentityCard />);
    fireEvent.press(screen.getByLabelText('编辑个人资料'));
    fireEvent.changeText(screen.getByLabelText('头像 URL'), 'file:///private/avatar.png');
    fireEvent.press(screen.getByLabelText('保存个人资料'));
    expect(screen.getByText('请填写 http 或 https 公开图片链接，或留空移除头像。')).toBeTruthy();
    expect(mockIdentity.saveProfile).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('取消编辑个人资料'));
    expect(screen.queryByLabelText('昵称')).toBeNull();
  });

  it('validates family names and preserves the editor on rename failure', async () => {
    mockIdentity.renameFamily.mockRejectedValueOnce(new Error('家庭名称保存失败'));
    render(<SharedIdentityCard />);
    fireEvent.press(screen.getByLabelText('修改家庭名 我们的家'));
    fireEvent.changeText(screen.getByLabelText('家庭名称'), '  ');
    fireEvent.press(screen.getByLabelText('保存家庭名称'));
    expect(screen.getByText('请填写家庭名称。')).toBeTruthy();
    expect(mockIdentity.renameFamily).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByLabelText('家庭名称'), '新家');
    fireEvent.press(screen.getByLabelText('保存家庭名称'));
    expect(await screen.findByText('家庭名称保存失败')).toBeTruthy();
    expect(screen.getByLabelText('家庭名称').props.value).toBe('新家');
    fireEvent.press(screen.getByLabelText('取消修改家庭名称'));
    expect(screen.queryByLabelText('家庭名称')).toBeNull();
  });

  it('allows only the family owner to rename a family', async () => {
    const { rerender } = render(<SharedIdentityCard />);
    fireEvent.press(screen.getByLabelText('修改家庭名 我们的家'));
    fireEvent.changeText(screen.getByLabelText('家庭名称'), ' 新家 ');
    fireEvent.press(screen.getByLabelText('保存家庭名称'));
    await waitFor(() => expect(mockIdentity.renameFamily).toHaveBeenCalledWith('family-1', '新家'));
    await waitFor(() => expect(screen.queryByLabelText('保存家庭名称')).toBeNull());
    mockIdentity.userId = 'user-2';
    rerender(<SharedIdentityCard />);
    expect(screen.queryByLabelText('修改家庭名 我们的家')).toBeNull();
    expect(screen.queryByText('解散家庭')).toBeNull();
  });

  it('shows initial fallback, missing-family guidance and image error fallback', () => {
    mockIdentity.families = [];
    const { rerender } = render(<SharedIdentityCard />);
    fireEvent(screen.getByLabelText('我的头像'), 'error');
    expect(screen.getByText('阿')).toBeTruthy();
    expect(screen.getByText('还没有共享家庭，前往 family-piggy 创建或加入即可。')).toBeTruthy();
    mockIdentity.profile = null;
    rerender(<SharedIdentityCard />);
    expect(screen.getByText('未设置昵称')).toBeTruthy();
  });
});
