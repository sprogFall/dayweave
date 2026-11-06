import { useEffect } from 'react';
import { AppState } from 'react-native';

import { IDENTITY_TTL } from '@/domain/identityCache';
import { useAuthStore } from '@/stores/auth.store';
import { useIdentityStore } from '@/stores/identity.store';

/** 只由根组件编排；不订阅 Realtime，回前台和每日检查都会尊重缓存有效期。 */
export function useIdentityLifecycle(): void {
  const userId = useAuthStore((state) => state.session?.user.id ?? null);
  useEffect(() => {
    const store = useIdentityStore.getState();
    store.reset();
    if (!userId) return;
    const load = () => { void store.load(); };
    load();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    const timer = setInterval(load, IDENTITY_TTL);
    return () => {
      listener.remove();
      clearInterval(timer);
      store.reset();
    };
  }, [userId]);
}
