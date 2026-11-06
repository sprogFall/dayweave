import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { uploadAvatar } from '@/services/avatar.service';
import type { Profile } from '@/types/domain';
import { SharedIdentityCard } from './SharedIdentityCard';

const mockIdentity = {
  userId: 'user-1' as string | null,
  profile: { id: 'user-1', displayName: '阿澈', avatarUrl: 'https://example.com/me.png', createdAt: '', updatedAt: '' } as Profile | null,
  families: [{ id: 'family-1', name: '我们的家', ownerId: 'user-1', createdAt: '' }],
  members: {}, loading: false, error: null as string | null,
  load: jest.fn(async () => {}),
  saveProfile: jest.fn(async (_patch: { displayName?: string; avatarUrl?: string | null }) => {}),
};
jest.mock('@/stores/identity.store', () => ({
  useIdentityStore: Object.assign((selector: (state: typeof mockIdentity) => unknown) => selector(mockIdentity), { getState: () => mockIdentity }),
}));
jest.mock('@/services/avatar.service', () => ({ uploadAvatar: jest.fn() }));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
const permissions = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const pick = ImagePicker.launchImageLibraryAsync as jest.Mock;
const upload = uploadAvatar as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockIdentity.userId = 'user-1';
  mockIdentity.loading = false;
  mockIdentity.error = null;
  permissions.mockResolvedValue({ granted: true });
  pick.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///avatar.jpg' }] });
  upload.mockResolvedValue('https://example.com/uploaded.jpg');
});

it('only shows personal identity with two compact accessible icon actions, no family or cache copy', () => {
  render(<SharedIdentityCard />);
  expect(screen.getByText('阿澈')).toBeTruthy();
  expect(screen.getByLabelText('我的头像').props.source).toEqual({ uri: 'https://example.com/me.png' });
  expect(screen.queryByText('我们的家')).toBeNull();
  expect(screen.queryByText(/缓存/)).toBeNull();
  expect(screen.queryByText('编辑个人资料')).toBeNull();
  expect(screen.queryByText('刷新共享资料')).toBeNull();
  expect(screen.getByLabelText('编辑个人资料').props.hitSlop).toBeGreaterThanOrEqual(8);
  expect(screen.getByLabelText('刷新共享资料').props.hitSlop).toBeGreaterThanOrEqual(8);
  expect(mockIdentity.load).not.toHaveBeenCalled();
});

it('forces refresh, disables duplicate actions and preserves identity on error', async () => {
  const { rerender } = render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('刷新共享资料'));
  await waitFor(() => expect(mockIdentity.load).toHaveBeenCalledWith({ force: true }));
  mockIdentity.loading = true;
  mockIdentity.error = '读取失败，请重试';
  rerender(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('刷新共享资料'));
  expect(mockIdentity.load).toHaveBeenCalledTimes(1);
  expect(screen.getByText('读取失败，请重试')).toBeTruthy();
  expect(screen.getByText('阿澈')).toBeTruthy();
});

it('edits only nickname in a DialogSheet and awaits save', async () => {
  render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('编辑个人资料'));
  expect(screen.getByText('修改昵称')).toBeTruthy();
  expect(screen.queryByLabelText('头像 URL')).toBeNull();
  fireEvent.changeText(screen.getByLabelText('昵称'), ' 新昵称 ');
  fireEvent.press(screen.getByLabelText('保存个人资料'));
  await waitFor(() => expect(mockIdentity.saveProfile).toHaveBeenCalledWith({ displayName: '新昵称' }));
  await waitFor(() => expect(screen.queryByLabelText('昵称')).toBeNull());
});

it('keeps nickname editor open on save failure', async () => {
  mockIdentity.saveProfile.mockRejectedValueOnce(new Error('保存失败'));
  render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('编辑个人资料'));
  fireEvent.press(screen.getByLabelText('保存个人资料'));
  expect(await screen.findByText('保存失败')).toBeTruthy();
  expect(screen.getByLabelText('昵称')).toBeTruthy();
});

it('opens avatar sheet, uploads selection then awaits shared profile save', async () => {
  let finishSave: () => void = () => {};
  mockIdentity.saveProfile.mockImplementationOnce(() => new Promise<void>((resolve) => { finishSave = resolve; }));
  render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('修改头像'));
  fireEvent.press(screen.getByLabelText('从相册上传'));
  await waitFor(() => expect(mockIdentity.saveProfile).toHaveBeenCalledWith({ avatarUrl: 'https://example.com/uploaded.jpg' }));
  expect(permissions).toHaveBeenCalledTimes(1);
  expect(pick).toHaveBeenCalledWith(expect.objectContaining({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1] }));
  expect(upload).toHaveBeenCalledWith('user-1', 'file:///avatar.jpg', 'image/jpeg');
  fireEvent.press(screen.getByLabelText('从相册上传'));
  expect(pick).toHaveBeenCalledTimes(1);
  expect(screen.getByText('更换头像')).toBeTruthy();
  await act(async () => finishSave());
  await waitFor(() => expect(screen.queryByText('更换头像')).toBeNull());
});

it('does not save the previous account upload after switching users', async () => {
  let finishUpload: (url: string) => void = () => {};
  upload.mockImplementationOnce(() => new Promise<string>((resolve) => { finishUpload = resolve; }));
  const { rerender } = render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('修改头像'));
  fireEvent.press(screen.getByLabelText('从相册上传'));
  await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
  mockIdentity.userId = 'user-2';
  rerender(<SharedIdentityCard />);
  await act(async () => finishUpload('https://example.com/old-account.jpg'));
  expect(mockIdentity.saveProfile).not.toHaveBeenCalled();
});

it('picker cancellation makes no upload or save requests', async () => {
  pick.mockResolvedValueOnce({ canceled: true, assets: null });
  render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('修改头像'));
  fireEvent.press(screen.getByLabelText('从相册上传'));
  await waitFor(() => expect(pick).toHaveBeenCalledTimes(1));
  expect(upload).not.toHaveBeenCalled();
  expect(mockIdentity.saveProfile).not.toHaveBeenCalled();
});

it('explains denied permission without opening picker', async () => {
  permissions.mockResolvedValueOnce({ granted: false });
  render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('修改头像'));
  fireEvent.press(screen.getByLabelText('从相册上传'));
  expect(await screen.findByText('需要相册权限才能上传头像，请在系统设置中允许访问。')).toBeTruthy();
  expect(pick).not.toHaveBeenCalled();
  expect(upload).not.toHaveBeenCalled();
});

it('normalizes native picker failure without exposing internal errors', async () => {
  pick.mockRejectedValueOnce(new Error('native private details'));
  render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('修改头像'));
  fireEvent.press(screen.getByLabelText('从相册上传'));
  expect(await screen.findByText('打开相册失败，请稍后重试。')).toBeTruthy();
  expect(upload).not.toHaveBeenCalled();
});

it('keeps avatar sheet open with Chinese upload failures', async () => {
  upload.mockRejectedValueOnce(new Error('上传头像失败，请稍后重试。'));
  render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('修改头像'));
  fireEvent.press(screen.getByLabelText('从相册上传'));
  expect(await screen.findByText('上传头像失败，请稍后重试。')).toBeTruthy();
  expect(mockIdentity.saveProfile).not.toHaveBeenCalled();
});

it('validates public URL separately and saves only avatar field', async () => {
  render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('修改头像'));
  fireEvent.press(screen.getByLabelText('编辑公开 URL'));
  fireEvent.changeText(screen.getByLabelText('头像 URL'), 'file:///private/avatar.png');
  fireEvent.press(screen.getByLabelText('保存头像链接'));
  expect(screen.getByText('请填写有效的 http 或 https 公开图片链接。')).toBeTruthy();
  expect(mockIdentity.saveProfile).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText('头像 URL'), ' https://example.com/new.png ');
  fireEvent.press(screen.getByLabelText('保存头像链接'));
  await waitFor(() => expect(mockIdentity.saveProfile).toHaveBeenCalledWith({ avatarUrl: 'https://example.com/new.png' }));
});

it('requires confirmation before removing avatar', async () => {
  render(<SharedIdentityCard />);
  fireEvent.press(screen.getByLabelText('修改头像'));
  fireEvent.press(screen.getByLabelText('移除头像'));
  expect(mockIdentity.saveProfile).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('确认移除头像'));
  await waitFor(() => expect(mockIdentity.saveProfile).toHaveBeenCalledWith({ avatarUrl: null }));
});
