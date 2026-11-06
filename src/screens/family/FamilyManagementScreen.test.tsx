import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useEffect as mockUseEffect } from 'react';

import { confirmAction } from '@/lib/alert';
import type { Family, FamilyMember } from '@/types/domain';

import { FamilyManagementScreen } from './FamilyManagementScreen';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
}));
jest.mock('@/lib/alert', () => ({ confirmAction: jest.fn() }));

const mockAuth = { session: { user: { id: 'me' } } };
jest.mock('@/stores/auth.store', () => ({ useAuthStore: { getState: () => mockAuth } }));

const families: Family[] = [
  { id: 'f1', name: '我的小家', ownerId: 'me', createdAt: '' },
  { id: 'f2', name: '父母家', ownerId: 'other', createdAt: '' },
];
const members: Record<string, FamilyMember[]> = {
  f1: [{ familyId: 'f1', userId: 'me', role: 'owner', displayName: '小明', avatarUrl: 'https://example.com/avatar.png' }],
  f2: [{ familyId: 'f2', userId: 'other', role: 'owner', displayName: '', avatarUrl: null }],
};
const mockIdentity = {
  userId: 'me', families, members, currentFamilyId: 'f1' as string | null,
  loading: false, error: null as string | null,
  load: jest.fn(), renameFamily: jest.fn(), setCurrentFamily: jest.fn(),
  joinFamily: jest.fn(), leaveFamily: jest.fn(),
};
jest.mock('@/stores/identity.store', () => ({
  useIdentityStore: Object.assign(
    (selector: (state: typeof mockIdentity) => unknown) => selector(mockIdentity),
    { getState: () => mockIdentity },
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.session.user.id = 'me';
  Object.assign(mockIdentity, { userId: 'me', families, members, currentFamilyId: 'f1', loading: false, error: null });
  for (const action of [mockIdentity.load, mockIdentity.renameFamily, mockIdentity.setCurrentFamily, mockIdentity.joinFamily, mockIdentity.leaveFamily]) action.mockResolvedValue(undefined);
  jest.mocked(confirmAction).mockResolvedValue(true);
});

it('loads on focus without bypassing the store cache and supports explicit refresh', async () => {
  render(<FamilyManagementScreen />);
  expect(mockIdentity.load).toHaveBeenCalledWith();
  fireEvent.press(screen.getByLabelText('刷新家庭'));
  await waitFor(() => expect(mockIdentity.load).toHaveBeenCalledWith({ force: true }));
});

it('shows families, current family, member names and avatars with owner-only rename', () => {
  render(<FamilyManagementScreen />);
  expect(screen.getByText('我的小家')).toBeTruthy();
  expect(screen.getByText('当前家庭')).toBeTruthy();
  expect(screen.getByText('小明')).toBeTruthy();
  expect(screen.getByLabelText('小明的头像').props.source).toEqual({ uri: 'https://example.com/avatar.png' });
  expect(screen.getByText('未设置昵称')).toBeTruthy();
  expect(screen.getByLabelText('修改家庭名 我的小家')).toBeTruthy();
  expect(screen.queryByLabelText('修改家庭名 父母家')).toBeNull();
  expect(screen.queryByLabelText('退出家庭 我的小家')).toBeNull();
  expect(screen.getByText(/所有者不能直接退出.*family-piggy.*解散会影响账本/)).toBeTruthy();
});

it('sets another family as current through the store', async () => {
  render(<FamilyManagementScreen />);
  fireEvent.press(screen.getByLabelText('设为当前家庭 父母家'));
  await waitFor(() => expect(mockIdentity.setCurrentFamily).toHaveBeenCalledWith('f2'));
});

it('keeps the join code after failure and clears it after a successful retry', async () => {
  mockIdentity.joinFamily.mockRejectedValueOnce(new Error('邀请码无效'));
  render(<FamilyManagementScreen />);
  fireEvent.changeText(screen.getByLabelText('家庭邀请码'), '  ABC123  ');
  fireEvent.press(screen.getByLabelText('加入家庭'));
  await waitFor(() => expect(screen.getByText('邀请码无效')).toBeTruthy());
  expect(mockIdentity.joinFamily).toHaveBeenCalledWith('ABC123');
  expect(screen.getByLabelText('家庭邀请码').props.value).toBe('  ABC123  ');
  fireEvent.press(screen.getByLabelText('加入家庭'));
  await waitFor(() => expect(screen.getByLabelText('家庭邀请码').props.value).toBe(''));
});

it('validates empty join and rename input without calling store mutations', async () => {
  render(<FamilyManagementScreen />);
  fireEvent.press(screen.getByLabelText('加入家庭'));
  expect(screen.getByText('请填写家庭邀请码。')).toBeTruthy();
  expect(mockIdentity.joinFamily).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('修改家庭名 我的小家'));
  fireEvent.changeText(screen.getByLabelText('家庭名称'), ' ');
  fireEvent.press(screen.getByLabelText('保存家庭名称'));
  expect(screen.getByText('请填写家庭名称。')).toBeTruthy();
  expect(mockIdentity.renameFamily).not.toHaveBeenCalled();
});

it('renames only the name and preserves it after failure', async () => {
  mockIdentity.renameFamily.mockRejectedValueOnce(new Error('改名失败'));
  render(<FamilyManagementScreen />);
  fireEvent.press(screen.getByLabelText('修改家庭名 我的小家'));
  fireEvent.changeText(screen.getByLabelText('家庭名称'), ' 新名字 ');
  fireEvent.press(screen.getByLabelText('保存家庭名称'));
  await waitFor(() => expect(screen.getByText('改名失败')).toBeTruthy());
  expect(screen.getByLabelText('家庭名称').props.value).toBe(' 新名字 ');
  fireEvent.press(screen.getByLabelText('保存家庭名称'));
  await waitFor(() => expect(screen.queryByLabelText('家庭名称')).toBeNull());
  expect(mockIdentity.renameFamily).toHaveBeenCalledWith('f1', '新名字');
});

it('requires explicit destructive confirmation and explains cross-app exit without historical deletion', async () => {
  jest.mocked(confirmAction).mockResolvedValueOnce(false);
  render(<FamilyManagementScreen />);
  fireEvent.press(screen.getByLabelText('退出家庭 父母家'));
  await waitFor(() => expect(confirmAction).toHaveBeenCalledWith(expect.objectContaining({
    destructive: true,
    message: expect.stringMatching(/Dayweave.*family-piggy.*同步退出.*不.*删除.*历史账务/),
  })));
  expect(mockIdentity.leaveFamily).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('退出家庭 父母家'));
  await waitFor(() => expect(mockIdentity.leaveFamily).toHaveBeenCalledWith('f2'));
});

it.each(['identity', 'auth'])('does not exit the new account after %s switches during confirmation', async (store) => {
  let resolveConfirmation: (value: boolean) => void = () => undefined;
  jest.mocked(confirmAction).mockImplementationOnce(() => new Promise<boolean>((resolve) => { resolveConfirmation = resolve; }));
  render(<FamilyManagementScreen />);
  fireEvent.press(screen.getByLabelText('退出家庭 父母家'));
  if (store === 'identity') mockIdentity.userId = 'new-account';
  else mockAuth.session.user.id = 'new-account';
  resolveConfirmation(true);
  await waitFor(() => expect(screen.getByLabelText('加入家庭').props.accessibilityState.disabled).toBe(false));
  expect(mockIdentity.leaveFamily).not.toHaveBeenCalled();
});

it('shows operation failures without removing the family', async () => {
  mockIdentity.leaveFamily.mockRejectedValueOnce(new Error('退出失败'));
  render(<FamilyManagementScreen />);
  fireEvent.press(screen.getByLabelText('退出家庭 父母家'));
  await waitFor(() => expect(screen.getByText('退出失败')).toBeTruthy());
  expect(screen.getByText('父母家')).toBeTruthy();
});

it('shows selection failures and allows retry without changing the current marker', async () => {
  mockIdentity.setCurrentFamily.mockRejectedValueOnce(new Error('切换失败'));
  render(<FamilyManagementScreen />);
  fireEvent.press(screen.getByLabelText('设为当前家庭 父母家'));
  await waitFor(() => expect(screen.getByText('切换失败')).toBeTruthy());
  expect(screen.getByText('当前家庭')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('设为当前家庭 父母家'));
  await waitFor(() => expect(screen.queryByText('切换失败')).toBeNull());
  expect(mockIdentity.setCurrentFamily).toHaveBeenCalledTimes(2);
});

it('blocks mutations while loading', () => {
  mockIdentity.loading = true;
  render(<FamilyManagementScreen />);
  fireEvent.press(screen.getByLabelText('设为当前家庭 父母家'));
  fireEvent.press(screen.getByLabelText('退出家庭 父母家'));
  fireEvent.press(screen.getByLabelText('加入家庭'));
  expect(mockIdentity.setCurrentFamily).not.toHaveBeenCalled();
  expect(mockIdentity.leaveFamily).not.toHaveBeenCalled();
  expect(mockIdentity.joinFamily).not.toHaveBeenCalled();
  expect(screen.getByLabelText('家庭邀请码').props.editable).toBe(false);
});

it('renders empty, loading and load error states with refresh available', () => {
  mockIdentity.families = [];
  mockIdentity.members = {};
  const view = render(<FamilyManagementScreen />);
  expect(screen.getByText(/还没有家庭/)).toBeTruthy();
  mockIdentity.loading = true;
  view.rerender(<FamilyManagementScreen />);
  expect(screen.getByText('正在加载家庭…')).toBeTruthy();
  expect(screen.queryByText(/还没有家庭/)).toBeNull();
  mockIdentity.loading = false;
  mockIdentity.error = '读取家庭失败';
  view.rerender(<FamilyManagementScreen />);
  expect(screen.getByText('读取家庭失败')).toBeTruthy();
  expect(screen.getByLabelText('刷新家庭')).toBeTruthy();
});
