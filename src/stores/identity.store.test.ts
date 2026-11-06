import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';

import { getMyProfile, updateMyProfile } from '@/services/profile.service';
import { joinFamily, leaveFamily, listMyFamilies, listFamilyMembers, renameFamily } from '@/services/family.service';
import { useAuthStore } from '@/stores/auth.store';
import { useIdentityStore } from './identity.store';

jest.mock('@/services/profile.service', () => ({ getMyProfile: jest.fn(), updateMyProfile: jest.fn() }));
jest.mock('@/services/family.service', () => ({
  listMyFamilies: jest.fn(), listFamilyMembers: jest.fn(), renameFamily: jest.fn(), joinFamily: jest.fn(), leaveFamily: jest.fn(),
}));

const profile = { id: 'u1', displayName: '共享昵称', avatarUrl: null, createdAt: '', updatedAt: '' };
const family = { id: 'f1', name: '我们家', ownerId: 'u1', createdAt: '' };
const member = { familyId: 'f1', userId: 'u1', role: 'owner' as const, displayName: '共享昵称', avatarUrl: null };
const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;
const KEY = 'identity:v1:u1';
function signIn(id: string | null) {
  useAuthStore.setState({ session: id ? ({ user: { id } } as unknown as Session) : null });
}
function cache(fetchedAt = NOW) {
  return JSON.stringify({ version: 1, userId: 'u1', profile, families: [family], members: { f1: [member] }, fetchedAt });
}

describe('shared identity store', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    await AsyncStorage.clear();
    useIdentityStore.getState().reset();
    signIn('u1');
    jest.mocked(getMyProfile).mockResolvedValue(profile);
    jest.mocked(listMyFamilies).mockResolvedValue([family]);
    jest.mocked(listFamilyMembers).mockResolvedValue([member]);
  });
  afterEach(() => jest.restoreAllMocks());

  it('loads shared profile, families and members, persisting a per-user snapshot', async () => {
    await useIdentityStore.getState().load();
    expect(getMyProfile).toHaveBeenCalledWith('u1');
    expect(listMyFamilies).toHaveBeenCalledWith('u1');
    expect(listFamilyMembers).toHaveBeenCalledWith('f1');
    expect(useIdentityStore.getState()).toMatchObject({ profile, families: [family], members: { f1: [member] }, fetchedAt: NOW, error: null, loading: false });
    expect(JSON.parse((await AsyncStorage.getItem(KEY))!)).toMatchObject({ userId: 'u1', fetchedAt: NOW });
  });

  it('uses a saved snapshot within 24 hours without network access', async () => {
    await AsyncStorage.setItem(KEY, cache(NOW - DAY + 1));
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState().profile).toEqual(profile);
    expect(getMyProfile).not.toHaveBeenCalled();
  });

  it('refreshes at exactly 24 hours and on manual refresh even before expiry', async () => {
    await AsyncStorage.setItem(KEY, cache(NOW - DAY));
    await useIdentityStore.getState().load();
    await useIdentityStore.getState().load();
    expect(getMyProfile).toHaveBeenCalledTimes(1);
    await useIdentityStore.getState().load({ force: true });
    expect(getMyProfile).toHaveBeenCalledTimes(2);
  });

  it('retains expired data and timestamp on failure, then retries', async () => {
    await AsyncStorage.setItem(KEY, cache(NOW - DAY));
    jest.mocked(getMyProfile).mockRejectedValueOnce(new Error('网络不可用'));
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState()).toMatchObject({ profile, fetchedAt: NOW - DAY, error: '网络不可用', loading: false });
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState().error).toBeNull();
    expect(getMyProfile).toHaveBeenCalledTimes(2);
  });

  it.each(['{broken', cache(NOW + DAY), JSON.stringify({ version: 1, userId: 'u1', profile: { id: 'u1' }, families: [], members: {}, fetchedAt: NOW }), cache().replaceAll('u1', 'u2')])(
    'discards invalid, future or other-user snapshots: %s', async (raw) => {
      await AsyncStorage.setItem(KEY, raw);
      await useIdentityStore.getState().load();
      expect(getMyProfile).toHaveBeenCalledTimes(1);
      expect(useIdentityStore.getState().profile).toEqual(profile);
    },
  );

  it('coalesces concurrent loads', async () => {
    await Promise.all([useIdentityStore.getState().load(), useIdentityStore.getState().load({ force: true })]);
    expect(getMyProfile).toHaveBeenCalledTimes(1);
  });

  it('does not expose old-account data or accept a late response after switching accounts', async () => {
    let resolve!: (value: typeof profile) => void;
    jest.mocked(getMyProfile).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const pending = useIdentityStore.getState().load();
    // Allow asynchronous local-cache read to complete before switching accounts.
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    signIn('u2');
    useIdentityStore.getState().reset();
    resolve(profile);
    await pending;
    expect(useIdentityStore.getState().profile).toBeNull();
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
  });

  it('reloads a different account without using the previous account cache', async () => {
    await useIdentityStore.getState().load();
    signIn('u2');
    jest.mocked(getMyProfile).mockResolvedValue({ ...profile, id: 'u2', displayName: '第二位' });
    jest.mocked(listMyFamilies).mockResolvedValue([]);
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState()).toMatchObject({ userId: 'u2', profile: { id: 'u2' }, families: [], members: {} });
  });

  it('updates the shared profile and member names without extending cache freshness', async () => {
    await AsyncStorage.setItem(KEY, cache(NOW - 1000));
    await useIdentityStore.getState().load();
    jest.mocked(updateMyProfile).mockResolvedValue({ ...profile, displayName: '新名字' });
    await useIdentityStore.getState().saveProfile({ displayName: '新名字' });
    expect(updateMyProfile).toHaveBeenCalledWith('u1', { displayName: '新名字' });
    expect(useIdentityStore.getState().members.f1[0].displayName).toBe('新名字');
    expect(useIdentityStore.getState().fetchedAt).toBe(NOW - 1000);
    expect(JSON.parse((await AsyncStorage.getItem(KEY))!).profile.displayName).toBe('新名字');
  });

  it('renames a family through the shared RPC service and updates cache', async () => {
    await useIdentityStore.getState().load();
    await useIdentityStore.getState().renameFamily('f1', '新家庭名');
    expect(renameFamily).toHaveBeenCalledWith('f1', '新家庭名');
    expect(useIdentityStore.getState().families[0].name).toBe('新家庭名');
  });

  it('clears memory when signed out and rejects writes', async () => {
    await useIdentityStore.getState().load();
    signIn(null);
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState().profile).toBeNull();
    await expect(useIdentityStore.getState().saveProfile({ displayName: 'x' })).rejects.toThrow('登录');
  });

  it('resolves and persists current family separately without changing v1 identity cache', async () => {
    const second = { ...family, id: 'f2' };
    jest.mocked(listMyFamilies).mockResolvedValue([family, second]);
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState().currentFamilyId).toBe('f1');
    await useIdentityStore.getState().setCurrentFamily('f2');
    expect(await AsyncStorage.getItem('identity:currentFamily:v1:u1')).toBe('f2');
    expect(JSON.parse((await AsyncStorage.getItem(KEY))!)).not.toHaveProperty('currentFamilyId');
    useIdentityStore.getState().reset();
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState().currentFamilyId).toBe('f2');
    jest.mocked(listMyFamilies).mockResolvedValue([family]);
    await useIdentityStore.getState().load({ force: true });
    expect(useIdentityStore.getState().currentFamilyId).toBe('f1');
    await expect(useIdentityStore.getState().setCurrentFamily('missing')).rejects.toThrow('家庭');
  });

  it('force refreshes after joining but preserves the existing current family', async () => {
    await useIdentityStore.getState().load();
    jest.mocked(joinFamily).mockResolvedValue('f2');
    jest.mocked(listMyFamilies).mockResolvedValue([family, { ...family, id: 'f2' }]);
    await useIdentityStore.getState().joinFamily('ABC123');
    expect(joinFamily).toHaveBeenCalledWith('ABC123');
    expect(listMyFamilies).toHaveBeenCalledTimes(2);
    expect(listFamilyMembers).toHaveBeenCalledWith('f2');
    expect(useIdentityStore.getState().currentFamilyId).toBe('f1');
  });

  it('does not reject a completed join if subsequent refresh fails', async () => {
    await useIdentityStore.getState().load();
    jest.mocked(joinFamily).mockResolvedValue('f2');
    jest.mocked(listMyFamilies).mockRejectedValueOnce(new Error('刷新失败'));
    await expect(useIdentityStore.getState().joinFamily('ABC123')).resolves.toBeUndefined();
    expect(useIdentityStore.getState().error).toContain('刷新');
    await useIdentityStore.getState().load();
    expect(listMyFamilies).toHaveBeenCalledTimes(3);
    jest.mocked(joinFamily).mockRejectedValueOnce(new Error('邀请码无效'));
    await expect(useIdentityStore.getState().joinFamily('bad')).rejects.toThrow('邀请码');
  });

  it('rejects owner leave and removes a member family plus its members and selection', async () => {
    const second = { ...family, id: 'f2', ownerId: 'u2' };
    jest.mocked(listMyFamilies).mockResolvedValue([family, second]);
    await useIdentityStore.getState().load();
    await expect(useIdentityStore.getState().leaveFamily('f1')).rejects.toThrow('创建者');
    expect(leaveFamily).not.toHaveBeenCalled();
    await useIdentityStore.getState().setCurrentFamily('f2');
    await useIdentityStore.getState().leaveFamily('f2');
    expect(leaveFamily).toHaveBeenCalledWith('f2', 'u1');
    expect(useIdentityStore.getState()).toMatchObject({ families: [family], currentFamilyId: 'f1' });
    expect(useIdentityStore.getState().members).not.toHaveProperty('f2');
    expect(JSON.parse((await AsyncStorage.getItem(KEY))!).families).toEqual([family]);
  });

  it('serializes a load started during profile save so stale reads cannot overwrite it', async () => {
    await useIdentityStore.getState().load();
    let finish!: (value: typeof profile) => void;
    jest.mocked(updateMyProfile).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const save = useIdentityStore.getState().saveProfile({ displayName: '新名字' });
    await Promise.resolve(); await Promise.resolve();
    const load = useIdentityStore.getState().load({ force: true });
    await Promise.resolve(); await Promise.resolve();
    expect(getMyProfile).toHaveBeenCalledTimes(1);
    const updated = { ...profile, displayName: '新名字' };
    jest.mocked(getMyProfile).mockResolvedValue(updated);
    finish(updated);
    await Promise.all([save, load]);
    expect(useIdentityStore.getState().profile).toEqual(updated);
  });

  it.each(['f999', '{broken', ''])('repairs an invalid persisted selection %s with a readable v1 snapshot', async (selection) => {
    await AsyncStorage.setItem(KEY, cache());
    await AsyncStorage.setItem('identity:currentFamily:v1:u1', selection);
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState().currentFamilyId).toBe('f1');
    expect(await AsyncStorage.getItem('identity:currentFamily:v1:u1')).toBe('f1');
    expect(getMyProfile).not.toHaveBeenCalled();
  });

  it('selects the first joined family when previously empty', async () => {
    jest.mocked(listMyFamilies).mockResolvedValueOnce([]);
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState().currentFamilyId).toBeNull();
    jest.mocked(joinFamily).mockResolvedValue('f1');
    await useIdentityStore.getState().joinFamily('ABC123');
    expect(useIdentityStore.getState().currentFamilyId).toBe('f1');
  });

  it('keeps a successful leave removed when an older load finishes first', async () => {
    jest.mocked(listMyFamilies).mockResolvedValue([{ ...family, ownerId: 'u2' }]);
    await useIdentityStore.getState().load();
    let finish!: (value: typeof profile) => void;
    jest.mocked(getMyProfile).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const load = useIdentityStore.getState().load({ force: true });
    await Promise.resolve(); await Promise.resolve();
    const leave = useIdentityStore.getState().leaveFamily('f1');
    finish(profile);
    await Promise.all([load, leave]);
    expect(useIdentityStore.getState()).toMatchObject({ families: [], members: {}, currentFamilyId: null });
  });

  it('does not apply late account mutations or execute queued writes as another account', async () => {
    await useIdentityStore.getState().load();
    let finish!: (value: typeof profile) => void;
    jest.mocked(updateMyProfile).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    const save = useIdentityStore.getState().saveProfile({ displayName: '旧账号' });
    await Promise.resolve(); await Promise.resolve();
    const rename = useIdentityStore.getState().renameFamily('f1', '旧家庭');
    const rejected = expect(rename).rejects.toThrow('登录');
    signIn('u2');
    jest.mocked(getMyProfile).mockResolvedValue({ ...profile, id: 'u2' });
    jest.mocked(listMyFamilies).mockResolvedValue([]);
    await useIdentityStore.getState().load();
    finish({ ...profile, displayName: '旧账号' });
    await save;
    await rejected;
    expect(renameFamily).not.toHaveBeenCalled();
    expect(useIdentityStore.getState()).toMatchObject({ userId: 'u2', profile: { id: 'u2' }, currentFamilyId: null });
    expect(JSON.parse((await AsyncStorage.getItem(KEY))!).profile.displayName).toBe('共享昵称');
  });

  it('does not report successful network data as failed when cache persistence fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState()).toMatchObject({ profile, error: null });
  });
});
