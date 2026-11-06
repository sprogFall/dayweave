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
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'active' });
    jest.mocked(useIdentityStore.getState).mockReturnValue({ load, reset } as unknown as ReturnType<typeof useIdentityStore.getState>);
    login('u1');
  });
  afterEach(() => jest.restoreAllMocks());
  it('checks every minute in foreground so near-expiry cache cannot wait another day', () => {
    jest.useFakeTimers();
    const listener = jest.spyOn(AppState, 'addEventListener');
    const { unmount } = renderHook(() => useIdentityLifecycle());
    expect(load).toHaveBeenCalledTimes(1);
    const onChange = listener.mock.calls[0][1];
    act(() => onChange('active'));
    expect(load).toHaveBeenCalledTimes(2);
    act(() => jest.advanceTimersByTime(60 * 1000));
    expect(load).toHaveBeenCalledTimes(3);
    act(() => onChange('background'));
    act(() => jest.advanceTimersByTime(60 * 1000));
    expect(load).toHaveBeenCalledTimes(3);
    act(() => onChange('active'));
    expect(load).toHaveBeenCalledTimes(4);
    unmount();
    jest.useRealTimers();
  });
  it('does not read on login or timer ticks while already in background', () => {
    jest.useFakeTimers();
    Object.defineProperty(AppState, 'currentState', { configurable: true, value: 'background' });
    const { unmount } = renderHook(() => useIdentityLifecycle());
    act(() => jest.advanceTimersByTime(2 * 60 * 1000));
    expect(load).not.toHaveBeenCalled();
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
