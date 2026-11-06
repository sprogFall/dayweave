import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuthStore } from '@/stores/auth.store';
import { useIdentityStore } from '@/stores/identity.store';

const CHECK_INTERVAL = 60 * 1000;

/** 仅在前台廉价检查 TTL；store 内未到期不联网，后台不触发读取。 */
export function useIdentityLifecycle(): void {
  const userId = useAuthStore((state) => state.session?.user.id ?? null);
  useEffect(() => {
    const store = useIdentityStore.getState();
    store.reset();
    if (!userId) return;
    let appState = AppState.currentState;
    const load = () => { void store.load(); };
    if (appState === 'active') load();
    const listener = AppState.addEventListener('change', (state) => {
      appState = state;
      if (state === 'active') load();
    });
    const timer = setInterval(() => {
      if (appState === 'active') load();
    }, CHECK_INTERVAL);
    return () => {
      listener.remove();
      clearInterval(timer);
      store.reset();
    };
  }, [userId]);
}
