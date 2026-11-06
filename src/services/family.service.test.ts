import { supabase } from '@/lib/supabase';
import { queryBuilder } from '@/test/postgrest';
import { listFamilyMembers, listMyFamilies, renameFamily } from './family.service';

const userId = '11111111-1111-4111-8111-111111111111';
const familyId = '22222222-2222-4222-8222-222222222222';
const family = { id: familyId, name: '我们家', owner_id: userId, created_at: '2026-11-01' };
const fromMock = supabase.from as jest.Mock;
const rpcMock = supabase.rpc as jest.Mock;
beforeEach(() => { fromMock.mockReset(); rpcMock.mockReset(); });

it('lists only the requested user memberships and maps visible families', async () => {
  const builder = queryBuilder({ data: [{ families: family }, { families: null }], error: null });
  fromMock.mockReturnValue(builder);
  await expect(listMyFamilies(userId)).resolves.toEqual([
    { id: familyId, name: '我们家', ownerId: userId, createdAt: '2026-11-01' },
  ]);
  expect(fromMock).toHaveBeenCalledWith('family_members');
  expect(builder.eq).toHaveBeenCalledWith('user_id', userId);
  expect(builder.select).toHaveBeenCalledWith('families(id, name, owner_id, created_at)');
});

it('reads members and shared profiles separately because their FK targets auth.users', async () => {
  const members = queryBuilder({ data: [
    { family_id: familyId, user_id: userId, role: 'owner' },
    { family_id: familyId, user_id: 'missing', role: 'member' },
  ], error: null });
  const profiles = Object.assign(queryBuilder({ data: [{ id: userId, nickname: '明', avatar_url: 'https://example.com/a' }], error: null }), { in: jest.fn().mockReturnThis() });
  fromMock.mockReturnValueOnce(members).mockReturnValueOnce(profiles);
  await expect(listFamilyMembers(familyId)).resolves.toEqual([
    { familyId, userId, role: 'owner', displayName: '明', avatarUrl: 'https://example.com/a' },
    { familyId, userId: 'missing', role: 'member', displayName: '成员', avatarUrl: null },
  ]);
  expect(members.eq).toHaveBeenCalledWith('family_id', familyId);
  expect(profiles.in).toHaveBeenCalledWith('id', [userId, 'missing']);
  expect(fromMock).toHaveBeenNthCalledWith(2, 'profiles');
});

it('returns empty lists without a needless profiles request', async () => {
  fromMock.mockReturnValue(queryBuilder({ data: null, error: null }));
  await expect(listMyFamilies(userId)).resolves.toEqual([]);
  await expect(listFamilyMembers(familyId)).resolves.toEqual([]);
  expect(fromMock).toHaveBeenCalledTimes(2);
});

it('renames with the existing RPC only and trims the name', async () => {
  rpcMock.mockResolvedValue({ data: null, error: null });
  await expect(renameFamily(familyId, ' 我们家 ')).resolves.toBeUndefined();
  expect(rpcMock).toHaveBeenCalledWith('rename_family', { p_family_id: familyId, p_name: '我们家' });
  expect(fromMock).not.toHaveBeenCalled();
});

it.each(['', 'bad-id', 'id,other'])('rejects invalid identifiers %s before accessing Supabase', async (id) => {
  await expect(listMyFamilies(id)).rejects.toThrow('用户标识无效');
  await expect(listFamilyMembers(id)).rejects.toThrow('家庭标识无效');
  await expect(renameFamily(id, '家')).rejects.toThrow('家庭标识无效');
  expect(fromMock).not.toHaveBeenCalled(); expect(rpcMock).not.toHaveBeenCalled();
});

it.each(['', '   ', '家'.repeat(13)])('rejects invalid family names %s', async (name) => {
  await expect(renameFamily(familyId, name)).rejects.toThrow('家庭名称需 1-12 个字符');
  expect(rpcMock).not.toHaveBeenCalled();
});

it('returns safe Chinese errors for every backend failure', async () => {
  fromMock.mockReturnValue(queryBuilder({ data: null, error: { message: 'secret' } }));
  await expect(listMyFamilies(userId)).rejects.toThrow('读取家庭失败');
  await expect(listFamilyMembers(familyId)).rejects.toThrow('读取家庭成员失败');
  rpcMock.mockResolvedValue({ error: { message: 'secret' } });
  await expect(renameFamily(familyId, '家')).rejects.toThrow('修改家庭名称失败');
});

it('does not silently treat a failed profiles request as missing profiles', async () => {
  fromMock.mockReturnValueOnce(queryBuilder({ data: [{ family_id: familyId, user_id: userId, role: 'member' }], error: null }));
  fromMock.mockReturnValueOnce(Object.assign(queryBuilder({ data: null, error: { message: 'secret' } }), { in: jest.fn().mockReturnThis() }));
  await expect(listFamilyMembers(familyId)).rejects.toThrow('读取家庭成员失败');
});
