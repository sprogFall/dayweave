import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { IDENTITY_STORAGE_KEY, isIdentityFresh, parseIdentityCache, type IdentitySnapshot } from '@/domain/identityCache';
import { toUserMessage } from '@/lib/errors';
import { getMyProfile, updateMyProfile } from '@/services/profile.service';
import { listMyFamilies, listFamilyMembers, renameFamily as renameSharedFamily } from '@/services/family.service';
import { useAuthStore } from '@/stores/auth.store';
import type { Family, FamilyMember, Profile } from '@/types/domain';

interface IdentityState {
  userId: string | null;
  profile: Profile | null;
  families: readonly Family[];
  members: Readonly<Record<string, readonly FamilyMember[]>>;
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
  load: (options?: { force?: boolean }) => Promise<void>;
  saveProfile: (patch: { displayName?: string; avatarUrl?: string | null }) => Promise<void>;
  renameFamily: (id: string, name: string) => Promise<void>;
  reset: () => void;
}
const EMPTY_FAMILIES: readonly Family[] = [];
const EMPTY_MEMBERS: Readonly<Record<string, readonly FamilyMember[]>> = {};
const initialState = {
  userId: null, profile: null, families: EMPTY_FAMILIES, members: EMPTY_MEMBERS,
  fetchedAt: null, loading: false, error: null,
};
let generation = 0;
let pending: { userId: string; generation: number; promise: Promise<void> } | null = null;
const currentUserId = () => useAuthStore.getState().session?.user.id ?? null;
const key = (userId: string) => `${IDENTITY_STORAGE_KEY}:${userId}`;

async function persist(state: IdentityState): Promise<void> {
  if (!state.userId || !state.profile || state.fetchedAt === null) return;
  const snapshot: IdentitySnapshot = {
    version: 1, userId: state.userId, profile: state.profile,
    families: state.families, members: state.members, fetchedAt: state.fetchedAt,
  };
  try {
    await AsyncStorage.setItem(key(state.userId), JSON.stringify(snapshot));
  } catch {
    // 缓存是可丢弃的加速层，写失败不把成功的远端操作变成失败。
  }
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  ...initialState,
  load: async (options = {}) => {
    const userId = currentUserId();
    if (!userId) { get().reset(); return; }
    if (get().userId !== userId) {
      generation += 1;
      pending = null;
      set({ ...initialState, userId });
    }
    if (pending?.userId === userId && pending.generation === generation) return pending.promise;
    if (!options.force && isIdentityFresh(get().fetchedAt, Date.now())) return;
    const token = generation;
    const active = () => token === generation && currentUserId() === userId;
    set({ loading: true, error: null });
    const promise = (async () => {
      if (get().fetchedAt === null) {
        let raw: string | null = null;
        try { raw = await AsyncStorage.getItem(key(userId)); } catch { /* 无缓存照常读远端。 */ }
        if (!active()) return;
        const cached = parseIdentityCache(raw, userId);
        if (cached && cached.fetchedAt <= Date.now()) {
          set({ profile: cached.profile, families: cached.families, members: cached.members, fetchedAt: cached.fetchedAt });
          if (!options.force && isIdentityFresh(cached.fetchedAt, Date.now())) return;
        }
      }
      try {
        const [profile, families] = await Promise.all([getMyProfile(userId), listMyFamilies(userId)]);
        const entries = await Promise.all(families.map(async (family) => [family.id, await listFamilyMembers(family.id)] as const));
        if (!active()) return;
        set({ profile, families, members: Object.fromEntries(entries), fetchedAt: Date.now(), error: null });
        await persist(get());
      } catch (error) {
        if (active()) set({ error: toUserMessage(error, '读取共享资料失败，请稍后重试。') });
      }
    })().finally(() => {
      if (active()) set({ loading: false });
      if (pending?.generation === token && pending.userId === userId) pending = null;
    });
    pending = { userId, generation: token, promise };
    return promise;
  },
  saveProfile: async (patch) => {
    const userId = currentUserId();
    if (!userId || get().userId !== userId) throw new Error('登录状态已失效，请重新登录。');
    // 先等当前读取结束，避免旧请求覆盖刚保存的新名字。
    if (pending?.userId === userId) await pending.promise;
    if (currentUserId() !== userId || get().userId !== userId) throw new Error('登录状态已失效，请重新登录。');
    const token = generation;
    const profile = await updateMyProfile(userId, patch);
    if (token !== generation || currentUserId() !== userId) return;
    const members = Object.fromEntries(Object.entries(get().members).map(([id, rows]) => [id,
      rows.map((member) => member.userId === userId ? { ...member, displayName: profile.displayName, avatarUrl: profile.avatarUrl } : member),
    ]));
    set({ profile, members, error: null });
    await persist(get());
  },
  renameFamily: async (id, name) => {
    const userId = currentUserId();
    if (!userId || get().userId !== userId) throw new Error('登录状态已失效，请重新登录。');
    if (pending?.userId === userId) await pending.promise;
    if (currentUserId() !== userId || get().userId !== userId) throw new Error('登录状态已失效，请重新登录。');
    const family = get().families.find((item) => item.id === id);
    if (!family || family.ownerId !== userId) throw new Error('只有家庭创建者可以修改家庭名称。');
    const token = generation;
    await renameSharedFamily(id, name);
    if (token !== generation || currentUserId() !== userId) return;
    set({ families: get().families.map((item) => item.id === id ? { ...item, name: name.trim() } : item), error: null });
    await persist(get());
  },
  reset: () => {
    generation += 1;
    pending = null;
    set(initialState);
  },
}));
