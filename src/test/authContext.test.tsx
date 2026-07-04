import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';

const testState = vi.hoisted(() => ({
  mockOnAuthStateChange: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockSignOut: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: testState.mockOnAuthStateChange,
      signOut: testState.mockSignOut,
    },
    from: testState.mockFrom,
    rpc: testState.mockRpc,
  },
  initialAuthHash: '',
}));

vi.mock('@/lib/plans', () => ({
  Profile: {},
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { AuthProvider, useAuth } from '@/context/AuthContext';

function profile(overrides = {}) {
  return { id: 'user-1', full_name: 'Test User', plan: 'free', message_limit: 500, ...overrides };
}

function selectChain(result: () => Promise<{ data: any }>) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(result),
      })),
    })),
  };
}

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthProvider, null, children);
}

describe('AuthContext restore flow', () => {
  let trigger: (event: string, session: any) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    testState.mockOnAuthStateChange.mockImplementation((cb: any) => {
      trigger = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it('sets profile from fetch on INITIAL_SESSION', async () => {
    const data = profile();
    testState.mockFrom.mockReturnValue(selectChain(() => Promise.resolve({ data })));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await trigger('INITIAL_SESSION', { user: { id: 'user-1' }, access_token: 'tok' });
    });

    await waitFor(() => expect(result.current.profile).toEqual(data));
    expect(result.current.loading).toBe(false);
  });

  it('calls restore RPC when profile fetch returns null', async () => {
    testState.mockFrom.mockReturnValue(selectChain(() => Promise.resolve({ data: null })));
    testState.mockRpc.mockResolvedValue({ data: true, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await trigger('INITIAL_SESSION', { user: { id: 'user-1' }, access_token: 'tok' });
    });

    await waitFor(() => {
      expect(testState.mockRpc).toHaveBeenCalledWith('restore_user_profile', { p_user_id: 'user-1' });
    });
  });

  it('sets profile when restore + re-fetch succeeds', async () => {
    const data = profile();
    let calls = 0;
    testState.mockFrom.mockReturnValue(selectChain(() => {
      calls++;
      return Promise.resolve({ data: calls === 1 ? null : data });
    }));
    testState.mockRpc.mockResolvedValue({ data: true, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await trigger('INITIAL_SESSION', { user: { id: 'user-1' }, access_token: 'tok' });
    });

    await waitFor(() => expect(result.current.profile).toEqual(data));
  });

  it('uses maybeSingle for profile query', async () => {
    const singleFn = vi.fn();
    const eqFn = vi.fn();
    const maybeSingleFn = vi.fn().mockResolvedValue({ data: null });
    singleFn.mockReturnValue({ eq: eqFn });
    eqFn.mockReturnValue({ maybeSingle: maybeSingleFn });
    testState.mockFrom.mockReturnValue({ select: singleFn });
    testState.mockRpc.mockResolvedValue({ data: false, error: null });

    renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await trigger('INITIAL_SESSION', { user: { id: 'user-1' }, access_token: 'tok' });
    });

    await waitFor(() => expect(singleFn).toHaveBeenCalled());
    expect(maybeSingleFn).toHaveBeenCalled();
  });

  it('sets restoring true during RPC call', async () => {
    testState.mockFrom.mockReturnValue(selectChain(() => Promise.resolve({ data: null })));
    testState.mockRpc.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await trigger('INITIAL_SESSION', { user: { id: 'user-1' }, access_token: 'tok' });
    });

    await waitFor(() => expect(result.current.restoring).toBe(true));
  });

  it('retryRestore resets and re-attempts', async () => {
    testState.mockFrom.mockReturnValue(selectChain(() => Promise.resolve({ data: null })));
    testState.mockRpc.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await trigger('INITIAL_SESSION', { user: { id: 'user-1' }, access_token: 'tok' });
    });

    await waitFor(() => expect(result.current.restoring).toBe(false));

    const data = profile();
    testState.mockFrom.mockReturnValue(selectChain(() => Promise.resolve({ data })));
    testState.mockRpc.mockResolvedValue({ data: true, error: null });

    await act(async () => {
      await result.current.retryRestore();
    });

    await waitFor(() => expect(result.current.profile).toEqual(data));
  });

  it('retryRestore no-ops without user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { await result.current.retryRestore(); });
    expect(result.current.restoreError).toBeNull();
  });

  it('signOut clears user, profile, restoreError', async () => {
    testState.mockFrom.mockReturnValue(selectChain(() => Promise.resolve({ data: profile() })));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await trigger('INITIAL_SESSION', { user: { id: 'user-1' }, access_token: 'tok' });
    });

    await waitFor(() => expect(result.current.profile).toBeTruthy());

    await act(async () => { await result.current.signOut(); });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.restoreError).toBeNull();
  });

  it('keeps local state even when supabase signOut throws', async () => {
    testState.mockSignOut.mockRejectedValue(new Error('net err'));
    testState.mockFrom.mockReturnValue(selectChain(() => Promise.resolve({ data: profile() })));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await trigger('INITIAL_SESSION', { user: { id: 'user-1' }, access_token: 'tok' });
    });

    await waitFor(() => expect(result.current.profile).toBeTruthy());

    await act(async () => { await result.current.signOut(); });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('safety timeout resolves loading after 3s', async () => {
    testState.mockOnAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });
    expect(result.current.user).toBeNull();
  });
});
