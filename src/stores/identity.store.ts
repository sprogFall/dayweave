import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { CURRENT_FAMILY_STORAGE_KEY, resolveCurrentFamily } from '@/domain/currentFamily';
import { IDENTITY_STORAGE_KEY, isIdentityFresh, parseIdentityCache, type IdentitySnapshot } from '@/domain/identityCache';
import { toUserMessage } from '@/lib/errors';
import { getMyProfile, updateMyProfile } from '@/services/profile.service';
import {
  listMyFamilies, listFamilyMembers, renameFamily as renameSharedFamily,
  joinFamily as joinSharedFamily, leaveFamily as leaveSharedFamily,
} from '@/services/family.service';
import { useAuthStore } from '@/stores/auth.store';
import type { Family, FamilyMember, Profile } from '@/types/domain';

interface IdentityState {
  userId: string | null;
  profile: Profile | null;
  families: readonly Family[];
  members: Readonly<Record<string, readonly FamilyMember[]>>;
  currentFamilyId: string | null;
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
  load: (options?: { force?: boolean }) => Promise<void>;
  saveProfile: (patch: { displayName?: string; avatarUrl?: string | null }) => Promise<void>;
  renameFamily: (id: string, name: string) => Promise<void>;
  setCurrentFamily: (id: string) => Promise<void>;
  joinFamily: (code: string) => Promise<void>;
  leaveFamily: (id: string) => Promise<void>;
  reset: () => void;
}
const EMPTY_FAMILIES: readonly Family[] = [];
const EMPTY_MEMBERS: Readonly<Record<string, readonly FamilyMember[]>> = {};
const initialState = {
  userId: null, profile: null, families: EMPTY_FAMILIES, members: EMPTY_MEMBERS,
  currentFamilyId: null, fetchedAt: null, loading: false, error: null,
};
let generation = 0;
let tail = Promise.resolve();
let pending: { userId: string; generation: number; promise: Promise<void> } | null = null;
const currentUserId = () => useAuthStore.getState().session?.user.id ?? null;
const key = (userId: string) => `${IDENTITY_STORAGE_KEY}:${userId}`;
const selectionKey = (userId: string) => `${CURRENT_FAMILY_STORAGE_KEY}:${userId}`;
const expiredSession = () => new Error('登录状态已失效，请重新登录。');

// 读取与写入共用队列：写入期间新来的读取不能提前取得旧远端快照。
function enqueue(work: () => Promise<void>): Promise<void> {
  const promise = tail.then(work);
  tail = promise.catch(() => undefined);
  return promise;
}
async function persist(state: IdentityState): Promise<void> {
  if (!state.userId) return;
  try {
    await AsyncStorage.setItem(selectionKey(state.userId), state.currentFamilyId ?? '');
    if (!state.profile || state.fetchedAt === null) return;
    const snapshot: IdentitySnapshot = {
      version: 1, userId: state.userId, profile: state.profile,
      families: state.families, members: state.members, fetchedAt: state.fetchedAt,
    };
    await AsyncStorage.setItem(key(state.userId), JSON.stringify(snapshot));
  } catch {
    // 缓存是可丢弃的加速层，写失败不把成功的远端操作变成失败。
  }
}

export const useIdentityStore = create<IdentityState>((set, get) => {
  const refresh = async (active: () => boolean, preferredId = get().currentFamilyId) => {
    const userId = get().userId!;
    const [profile, families] = await Promise.all([getMyProfile(userId), listMyFamilies(userId)]);
    if (!active()) return;
    const entries = await Promise.all(families.map(async (family) => [family.id, await listFamilyMembers(family.id)] as const));
    if (!active()) return;
    set({ profile, families, members: Object.fromEntries(entries), fetchedAt: Date.now(),
      currentFamilyId: resolveCurrentFamily(preferredId, families), error: null });
    await persist(get());
  };
  const mutate = (work: (userId: string, active: () => boolean) => Promise<void>) => {
    const userId = currentUserId();
    const token = generation;
    if (!userId || get().userId !== userId) return Promise.reject(expiredSession());
    // 后续 load 必须排在此次 mutation 后，而非合并进更早的 load。
    pending = null;
    const active = () => token === generation && currentUserId() === userId && get().userId === userId;
    return enqueue(async () => {
      if (!active()) throw expiredSession();
      try {
        await work(userId, active);
      } catch (error) {
        if (active()) set({ error: toUserMessage(error, '操作失败，请稍后重试。') });
        throw error;
      }
    });
  };
  return {
    ...initialState,
    load: (options = {}) => {
      const userId = currentUserId();
      if (!userId) { get().reset(); return Promise.resolve(); }
      if (get().userId !== userId) {
        get().reset();
        set({ userId });
      }
      if (pending?.userId === userId && pending.generation === generation) return pending.promise;
      const token = generation;
      const active = () => token === generation && currentUserId() === userId;
      const promise = enqueue(async () => {
        if (!active() || (!options.force && isIdentityFresh(get().fetchedAt, Date.now()))) return;
        set({ loading: true, error: null });
        try {
          let preferred = get().currentFamilyId;
          if (get().fetchedAt === null) {
            let raw: string | null = null;
            try {
              [raw, preferred] = await Promise.all([AsyncStorage.getItem(key(userId)), AsyncStorage.getItem(selectionKey(userId))]);
            } catch { /* 无缓存照常读远端。 */ }
            if (!active()) return;
            const cached = parseIdentityCache(raw, userId);
            if (cached && cached.fetchedAt <= Date.now()) {
              set({ profile: cached.profile, families: cached.families, members: cached.members,
                fetchedAt: cached.fetchedAt, currentFamilyId: resolveCurrentFamily(preferred, cached.families) });
              if (!options.force && isIdentityFresh(cached.fetchedAt, Date.now())) {
                await persist(get());
                return;
              }
            }
          }
          await refresh(active, preferred);
        } catch (error) {
          if (active()) set({ error: toUserMessage(error, '读取共享资料失败，请稍后重试。') });
        } finally {
          if (active()) set({ loading: false });
        }
      }).finally(() => {
        if (pending?.promise === promise) pending = null;
      });
      pending = { userId, generation: token, promise };
      return promise;
    },
    saveProfile: (patch) => mutate(async (userId, active) => {
      const profile = await updateMyProfile(userId, patch);
      if (!active()) return;
      const members = Object.fromEntries(Object.entries(get().members).map(([id, rows]) => [id,
        rows.map((member) => member.userId === userId ? { ...member, displayName: profile.displayName, avatarUrl: profile.avatarUrl } : member),
      ]));
      set({ profile, members, error: null });
      await persist(get());
    }),
    renameFamily: (id, name) => mutate(async (userId, active) => {
      const family = get().families.find((item) => item.id === id);
      if (!family || family.ownerId !== userId) throw new Error('只有家庭创建者可以修改家庭名称。');
      await renameSharedFamily(id, name);
      if (!active()) return;
      set({ families: get().families.map((item) => item.id === id ? { ...item, name: name.trim() } : item), error: null });
      await persist(get());
    }),
    setCurrentFamily: (id) => mutate(async (_userId, active) => {
      if (!get().families.some((family) => family.id === id)) throw new Error('请选择已加入的家庭。');
      if (!active()) return;
      set({ currentFamilyId: id, error: null });
      await persist(get());
    }),
    joinFamily: (code) => mutate(async (_userId, active) => {
      await joinSharedFamily(code);
      if (!active()) return;
      set({ loading: true, error: null });
      try {
        await refresh(active);
      } catch (error) {
        // 已经加入成功；不能让 UI 误以为加入失败而重试邀请码。
        if (active()) {
          set({ fetchedAt: 0, error: `已加入家庭，但刷新失败：${toUserMessage(error, '请手动刷新家庭资料。')}` });
          await persist(get());
        }
      } finally {
        if (active()) set({ loading: false });
      }
    }),
    leaveFamily: (id) => mutate(async (userId, active) => {
      const family = get().families.find((item) => item.id === id);
      if (!family) throw new Error('该家庭不在已加入列表中。');
      if (family.ownerId === userId) {
        throw new Error('家庭创建者不能退出家庭。');
      }
      await leaveSharedFamily(id, userId);
      if (!active()) return;
      const families = get().families.filter((item) => item.id !== id);
      const members = Object.fromEntries(Object.entries(get().members).filter(([familyId]) => familyId !== id));
      set({ families, members, currentFamilyId: resolveCurrentFamily(get().currentFamilyId, families), error: null });
      await persist(get());
    }),
    reset: () => {
      generation += 1;
      pending = null;
      tail = Promise.resolve();
      set(initialState);
    },
  };
});
