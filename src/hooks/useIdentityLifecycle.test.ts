import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { useAuthStore } from '@/stores/auth.store';
import { useIdentityStore } from '@/stores/identity.store';
import { useIdentityLifecycle } from './useIdentityLifecycle';

jest.mock('@/stores/identity.store', () => ({ useIdentityStore: { getState: jest.fn() } }));
const load = jest.fn(async () => undefined);
const reset = jest.fn();
function login(id: string | null) {
  useAuthStore.setState({ status: id ? 'signedIn' : 'signedOut', session: id ? ({ user: { id } } as unknown as Session) : null });
}
describe('identity lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useIdentityStore.getState).mockReturnValue({ load, reset } as unknown as ReturnType<typeof useIdentityStore.getState>);
    login('u1');
  });
  afterEach(() => jest.restoreAllMocks());
  it('loads on login, foreground, and the daily expiry timer, then cleans up', () => {
    jest.useFakeTimers();
    const listener = jest.spyOn(AppState, 'addEventListener');
    const { unmount } = renderHook(() => useIdentityLifecycle());
    expect(load).toHaveBeenCalledTimes(1);
    const onChange = listener.mock.calls[0][1];
    act(() => onChange('active'));
    expect(load).toHaveBeenCalledTimes(2);
    act(() => jest.advanceTimersByTime(24 * 60 * 60 * 1000));
    expect(load).toHaveBeenCalledTimes(3);
    unmount();
    jest.useRealTimers();
  });
  it('clears old identity state on account changes and sign out', () => {
    renderHook(() => useIdentityLifecycle());
    const calls = reset.mock.calls.length;
    act(() => login('u2'));
    expect(reset.mock.calls.length).toBeGreaterThan(calls);
    const loads = load.mock.calls.length;
    const resets = reset.mock.calls.length;
    act(() => login(null));
    expect(load).toHaveBeenCalledTimes(loads);
    expect(reset.mock.calls.length).toBeGreaterThan(resets);
  });
});
