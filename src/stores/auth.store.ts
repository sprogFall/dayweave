import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { toUserMessage } from '@/lib/errors';
import {
  getInitialSession,
  onAuthStateChange,
  signIn,
  signOut,
  signUp,
} from '@/services/auth.service';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (displayName: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

let authSubscription: { unsubscribe: () => void } | null = null;
let initializing: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,

  initialize: async () => {
    if (initializing) return initializing;

    initializing = (async () => {
      // 先注册监听，再读取初始 session，避免两者之间发生的登录事件丢失。
      authSubscription?.unsubscribe();
      authSubscription = onAuthStateChange((session) => {
        set({ session, status: session ? 'signedIn' : 'signedOut' });
      });

      try {
        const session = await getInitialSession();
        set({ session, status: session ? 'signedIn' : 'signedOut' });
      } catch (error) {
        set({ session: null, status: 'signedOut' });
        throw new Error(toUserMessage(error, '恢复登录状态失败。'));
      }
    })().finally(() => {
      initializing = null;
    });

    return initializing;
  },

  signIn: async (email, password) => {
    await signIn(email, password);
  },

  signUp: async (displayName, email, password) => {
    return signUp(displayName, email, password);
  },

  signOut: async () => {
    await signOut();
  },
}));
