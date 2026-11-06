import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';

import { CARD_IDS, DEFAULT_CARD_IDS } from '@/domain/cardLayout';
import { useAuthStore } from '@/stores/auth.store';

import { useCardLayoutStore } from './cardLayout.store';

const KEY = 'cards:layout:v1:user-1';

function signIn(userId: string | null) {
  useAuthStore.setState({
    session: userId === null ? null : ({ user: { id: userId } } as unknown as Session),
    status: userId === null ? 'signedOut' : 'signedIn',
  });
}

describe('cardLayout store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useCardLayoutStore.getState().reset();
    signIn('user-1');
  });

  it('uses defaults when the user has no saved layout', async () => {
    await useCardLayoutStore.getState().hydrate();

    expect(useCardLayoutStore.getState().status).toBe('ready');
    expect(useCardLayoutStore.getState().layouts.today).toEqual(DEFAULT_CARD_IDS.today);
    expect(useCardLayoutStore.getState().layouts.profile).toEqual(DEFAULT_CARD_IDS.profile);
  });

  it('restores a saved layout and drops cards that no longer exist', async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, today: ['streak', 'retired-card'], profile: [] }),
    );

    await useCardLayoutStore.getState().hydrate();

    expect(useCardLayoutStore.getState().layouts.today).toEqual(['streak']);
    // 空数组是用户主动删光，不能回落到默认值。
    expect(useCardLayoutStore.getState().layouts.profile).toEqual([]);
  });

  it('falls back to defaults when storage is corrupt', async () => {
    await AsyncStorage.setItem(KEY, '{not json');

    await useCardLayoutStore.getState().hydrate();

    expect(useCardLayoutStore.getState().layouts.today).toEqual(DEFAULT_CARD_IDS.today);
  });

  it('toggles a card and persists the result', async () => {
    await useCardLayoutStore.getState().hydrate();

    useCardLayoutStore.getState().toggle('today', CARD_IDS.streak);
    expect(useCardLayoutStore.getState().layouts.today).toContain(CARD_IDS.streak);

    useCardLayoutStore.getState().toggle('today', CARD_IDS.streak);
    expect(useCardLayoutStore.getState().layouts.today).not.toContain(CARD_IDS.streak);

    const saved = await AsyncStorage.getItem(KEY);
    expect(JSON.parse(saved ?? '{}').today).not.toContain(CARD_IDS.streak);
  });

  it('moves a card within its page and persists the order', async () => {
    await useCardLayoutStore.getState().hydrate();

    useCardLayoutStore.getState().move('today', CARD_IDS.weekSummary, -1);

    expect(useCardLayoutStore.getState().layouts.today).toEqual([
      CARD_IDS.weekSummary,
      CARD_IDS.todayHours,
    ]);

    const saved = await AsyncStorage.getItem(KEY);
    expect(JSON.parse(saved ?? '{}').today).toEqual([CARD_IDS.weekSummary, CARD_IDS.todayHours]);
  });

  it('keeps pages independent', async () => {
    await useCardLayoutStore.getState().hydrate();

    useCardLayoutStore.getState().toggle('profile', CARD_IDS.todayHours);

    expect(useCardLayoutStore.getState().layouts.profile).toContain(CARD_IDS.todayHours);
    expect(useCardLayoutStore.getState().layouts.today).toEqual(DEFAULT_CARD_IDS.today);
  });

  it('does not overwrite in-memory changes when hydrated again', async () => {
    await useCardLayoutStore.getState().hydrate();
    useCardLayoutStore.getState().toggle('today', CARD_IDS.streak);
    const afterToggle = useCardLayoutStore.getState().layouts.today;

    await useCardLayoutStore.getState().hydrate();

    expect(useCardLayoutStore.getState().layouts.today).toEqual(afterToggle);
  });
});
