import { supabase } from '@/lib/supabase';
import { queryBuilder } from '@/test/postgrest';
import { getMyProfile, updateMyProfile } from './profile.service';

const userId = '11111111-1111-4111-8111-111111111111';
const row = {
  id: userId, nickname: '小明', avatar_url: null,
  created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-02T00:00:00Z',
};
const fromMock = supabase.from as jest.Mock;

beforeEach(() => fromMock.mockReset());

it('reads the shared profile and preserves domain names and timestamps', async () => {
  const builder = queryBuilder({ data: row, error: null });
  fromMock.mockReturnValue(builder);
  await expect(getMyProfile(userId)).resolves.toEqual({
    id: userId, displayName: '小明', avatarUrl: null,
    createdAt: row.created_at, updatedAt: row.updated_at,
  });
  expect(fromMock).toHaveBeenCalledWith('profiles');
  expect(builder.select).toHaveBeenCalledWith('id, nickname, avatar_url, created_at, updated_at');
  expect(builder.eq).toHaveBeenCalledWith('id', userId);
});

it('updates only supplied shared fields and trims the nickname', async () => {
  const builder = queryBuilder({ data: row, error: null });
  fromMock.mockReturnValue(builder);
  await updateMyProfile(userId, { displayName: ' 小明 ', avatarUrl: null });
  expect(fromMock).toHaveBeenCalledWith('profiles');
  expect(builder.update).toHaveBeenCalledWith({ nickname: '小明', avatar_url: null });
  expect(builder.eq).toHaveBeenCalledWith('id', userId);
  await updateMyProfile(userId, { avatarUrl: 'https://example.com/avatar.png' });
  expect(builder.update).toHaveBeenLastCalledWith({ avatar_url: 'https://example.com/avatar.png' });
});

it.each(['', 'user-1', '  ', '11111111-1111-4111-8111-111111111111,other'])('rejects invalid user id %s before querying', async (id) => {
  await expect(getMyProfile(id)).rejects.toThrow('用户标识无效');
  await expect(updateMyProfile(id, { displayName: '明' })).rejects.toThrow('用户标识无效');
  expect(fromMock).not.toHaveBeenCalled();
});

it.each([
  {}, { displayName: '  ' }, { displayName: '明'.repeat(51) },
  { avatarUrl: 'javascript:alert(1)' }, { avatarUrl: 'file:///avatar' },
])('rejects unsafe or empty updates %j', async (patch) => {
  await expect(updateMyProfile(userId, patch)).rejects.toThrow();
  expect(fromMock).not.toHaveBeenCalled();
});

it('normalizes missing rows and backend failures into Chinese messages', async () => {
  fromMock.mockReturnValue(queryBuilder({ data: null, error: { message: 'private database detail' } }));
  await expect(getMyProfile(userId)).rejects.toThrow('读取个人资料失败');
  await expect(updateMyProfile(userId, { displayName: '明' })).rejects.toThrow('保存个人资料失败');
  fromMock.mockReturnValue(queryBuilder({ data: null, error: null }));
  await expect(getMyProfile(userId)).rejects.toThrow('读取个人资料失败');
});
