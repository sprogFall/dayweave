import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import {
  CARD_STORAGE_KEY,
  DEFAULT_CARD_IDS,
  availableCardIds,
  moveCardId,
  parseSnapshot,
  readScope,
  resolveCardIds,
  toSnapshot,
  toggleCardId,
  type CardId,
  type CardScope,
} from '@/domain/cardLayout';
import { useAuthStore } from '@/stores/auth.store';

/** 卡片配置属于设备偏好，按用户分键，换账号不会串配置。 */
function storageKey(userId: string): string {
  return `${CARD_STORAGE_KEY}:${userId}`;
}

const DEFAULT_LAYOUTS: Record<CardScope, readonly CardId[]> = {
  today: DEFAULT_CARD_IDS.today,
  profile: DEFAULT_CARD_IDS.profile,
};

export type CardLayoutStatus = 'idle' | 'loading' | 'ready';

export interface CardLayoutState {
  status: CardLayoutStatus;
  layouts: Record<CardScope, readonly CardId[]>;
  hydrate: () => Promise<void>;
  toggle: (scope: CardScope, id: CardId) => void;
  move: (scope: CardScope, id: CardId, delta: number) => void;
  reset: () => void;
}

let hydration: Promise<void> | null = null;

function currentUserId(): string | null {
  return useAuthStore.getState().session?.user.id ?? null;
}

async function persist(
  layouts: Record<CardScope, readonly CardId[]>,
): Promise<void> {
  const userId = currentUserId();
  if (!userId) return;

  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(toSnapshot(layouts)));
  } catch {
    // 本地偏好写失败不影响当前会话，下次变更会再试一次。
  }
}

function scopeLayouts(
  snapshot: unknown,
  scope: CardScope,
): CardId[] {
  return resolveCardIds(readScope(snapshot, scope), availableCardIds(scope), DEFAULT_CARD_IDS[scope]);
}

export const useCardLayoutStore = create<CardLayoutState>((set, get) => ({
  status: 'idle',
  layouts: DEFAULT_LAYOUTS,

  hydrate: async () => {
    if (get().status === 'ready') return;
    if (hydration) return hydration;

    hydration = (async () => {
      set({ status: 'loading' });

      const userId = currentUserId();
      if (!userId) {
        set({ status: 'ready', layouts: DEFAULT_LAYOUTS });
        return;
      }

      let raw: string | null = null;
      try {
        raw = await AsyncStorage.getItem(storageKey(userId));
      } catch {
        raw = null;
      }

      const snapshot = parseSnapshot(raw);
      set({
        status: 'ready',
        layouts: {
          today: scopeLayouts(snapshot, 'today'),
          profile: scopeLayouts(snapshot, 'profile'),
        },
      });
    })().finally(() => {
      hydration = null;
    });

    return hydration;
  },

  toggle: (scope, id) => {
    const next = toggleCardId(get().layouts[scope], id, availableCardIds(scope));
    const layouts: Record<CardScope, readonly CardId[]> = { ...get().layouts, [scope]: next };
    set({ layouts });
    void persist(layouts);
  },

  move: (scope, id, delta) => {
    const next = moveCardId(get().layouts[scope], id, delta);
    const layouts: Record<CardScope, readonly CardId[]> = { ...get().layouts, [scope]: next };
    set({ layouts });
    void persist(layouts);
  },

  reset: () => set({ status: 'idle', layouts: DEFAULT_LAYOUTS }),
}));
