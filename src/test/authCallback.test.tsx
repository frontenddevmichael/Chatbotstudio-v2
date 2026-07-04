import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { mockGetSession, mockOnAuthStateChange, mockNavigate } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
  initialAuthHash: '',
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => React.createElement(React.Fragment, null, children),
  HelmetProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

describe('AuthCallback — error description handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  function renderCallback(hash: string) {
    window.location.hash = hash;
    return render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/auth/callback'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/auth/callback', lazy: () => import('@/pages/auth/AuthCallback') }),
          React.createElement(Route, { path: '/login', element: React.createElement('div', null, 'login page') }),
          React.createElement(Route, { path: '/reset-password', element: React.createElement('div', null, 'reset page') }),
        ),
      ),
    );
  }

  it('shows fallback toast for encoded empty object error_description', async () => {
    window.location.hash = '#error_description=%7B%7D';
    const AuthCallback = (await import('@/pages/auth/AuthCallback')).default;

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/auth/callback'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/auth/callback', element: React.createElement(AuthCallback) }),
          React.createElement(Route, { path: '/login', element: React.createElement('div', null, 'login page') }),
        ),
      ),
    );

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });

    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('shows decoded error_description for readable strings', async () => {
    window.location.hash = '#error_description=Email+not+confirmed';
    const AuthCallback = (await import('@/pages/auth/AuthCallback')).default;

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/auth/callback'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/auth/callback', element: React.createElement(AuthCallback) }),
          React.createElement(Route, { path: '/login', element: React.createElement('div', null, 'login page') }),
        ),
      ),
    );

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email not confirmed');
    });
  });

  it('forwards recovery type to /reset-password with hash', async () => {
    window.location.hash = '#type=recovery&access_token=abc123';
    const AuthCallback = (await import('@/pages/auth/AuthCallback')).default;

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/auth/callback'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/auth/callback', element: React.createElement(AuthCallback) }),
          React.createElement(Route, { path: '/reset-password', element: React.createElement('div', null, 'reset page') }),
        ),
      ),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/reset-password#type=recovery&access_token=abc123',
        { replace: true },
      );
    });
  });

  it('navigates to login after 5s timeout when no session', { timeout: 10000 }, async () => {
    window.location.hash = '#access_token=some_token';
    const AuthCallback = (await import('@/pages/auth/AuthCallback')).default;

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/auth/callback'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/auth/callback', element: React.createElement(AuthCallback) }),
          React.createElement(Route, { path: '/login', element: React.createElement('div', null, 'login page') }),
        ),
      ),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    }, { timeout: 6000 });
  });

  it('calls finish(true) when getSession returns a session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
    window.location.hash = '#access_token=some_token';
    const AuthCallback = (await import('@/pages/auth/AuthCallback')).default;

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/auth/callback'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/auth/callback', element: React.createElement(AuthCallback) }),
          React.createElement(Route, { path: '/dashboard', element: React.createElement('div', null, 'dashboard') }),
          React.createElement(Route, { path: '/login', element: React.createElement('div', null, 'login page') }),
        ),
      ),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
