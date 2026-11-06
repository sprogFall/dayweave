import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';

import { getMyProfile, updateMyProfile } from '@/services/profile.service';
import { listMyFamilies, listFamilyMembers, renameFamily } from '@/services/family.service';
import { useAuthStore } from '@/stores/auth.store';
import { useIdentityStore } from './identity.store';

jest.mock('@/services/profile.service', () => ({ getMyProfile: jest.fn(), updateMyProfile: jest.fn() }));
jest.mock('@/services/family.service', () => ({
  listMyFamilies: jest.fn(), listFamilyMembers: jest.fn(), renameFamily: jest.fn(),
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

  it('does not report successful network data as failed when cache persistence fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await useIdentityStore.getState().load();
    expect(useIdentityStore.getState()).toMatchObject({ profile, error: null });
  });
});
