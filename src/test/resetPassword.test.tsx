import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => React.createElement(React.Fragment, null, children),
  HelmetProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

const testState = vi.hoisted(() => ({
  mockUpdateUser: vi.fn(),
  mockNavigate: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => testState.mockNavigate,
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: (...args: any[]) => testState.mockUpdateUser(...args),
      onAuthStateChange: (...args: any[]) => testState.mockOnAuthStateChange(...args),
    },
  },
  initialAuthHash: '',
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: any[]) => testState.mockToastError(...args),
    success: (...args: any[]) => testState.mockToastSuccess(...args),
  },
}));

function setupHash(hash: string) {
  window.location.hash = hash;
}

async function fillAndSubmit() {
  const pw = screen.getByLabelText('New Password');
  fireEvent.change(pw, { target: { value: 'newpassword123' } });
  const confirm = screen.getByLabelText('Confirm Password');
  fireEvent.change(confirm, { target: { value: 'newpassword123' } });
  fireEvent.click(screen.getByText('Update Password'));
}

describe('ResetPassword — expired link detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  async function renderReset(hash = '#type=recovery&access_token=valid') {
    setupHash(hash);
    const ResetPassword = (await import('@/pages/auth/ResetPassword')).default;
    return render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/reset-password'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/reset-password', element: React.createElement(ResetPassword) }),
          React.createElement(Route, { path: '/forgot-password', element: React.createElement('div', null, 'forgot page') }),
          React.createElement(Route, { path: '/login', element: React.createElement('div', null, 'login') }),
        ),
      ),
    );
  }

  it('shows form when recovery token is present in hash', async () => {
    await renderReset('#type=recovery&access_token=abc123');
    expect(await screen.findByText('Update Password')).toBeTruthy();
  });

  it('shows "Link expired" when updateUser fails with expired session', async () => {
    testState.mockUpdateUser.mockRejectedValue(new Error('Session expired'));
    await renderReset();
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('Link expired')).toBeTruthy();
    });
  });

  it('shows "Link expired" when updateUser fails with "not authenticated"', async () => {
    testState.mockUpdateUser.mockRejectedValue(new Error('not authenticated'));
    await renderReset();
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('Link expired')).toBeTruthy();
    });
  });

  it('does NOT show "Link expired" for non-session errors', async () => {
    testState.mockUpdateUser.mockRejectedValue(new Error('Password too weak'));
    await renderReset();
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.queryByText('Link expired')).toBeNull();
    });
    expect(testState.mockToastError).toHaveBeenCalledWith('Password too weak');
  });

  it('"Request New Link" navigates to /forgot-password', async () => {
    testState.mockUpdateUser.mockRejectedValue(new Error('Session expired'));
    await renderReset();
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('Request New Link')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Request New Link'));
    expect(testState.mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('minLength=8 validation prevents short passwords', async () => {
    testState.mockUpdateUser.mockResolvedValue({ error: null });
    await renderReset();

    const passwordInput = screen.getByLabelText('New Password') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    const confirmInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
    fireEvent.change(confirmInput, { target: { value: 'short' } });
    fireEvent.click(screen.getByText('Update Password'));

    await waitFor(() => {
      expect(testState.mockToastError).toHaveBeenCalledWith('Password must be at least 8 characters');
    });
  });

  it('password mismatch validation', async () => {
    await renderReset();

    const passwordInput = screen.getByLabelText('New Password');
    fireEvent.change(passwordInput, { target: { value: 'password1' } });
    const confirmInput = screen.getByLabelText('Confirm Password');
    fireEvent.change(confirmInput, { target: { value: 'password2' } });
    fireEvent.click(screen.getByText('Update Password'));

    await waitFor(() => {
      expect(testState.mockToastError).toHaveBeenCalledWith('Passwords do not match');
    });
  });

  it('successful update navigates to /dashboard', async () => {
    testState.mockUpdateUser.mockResolvedValue({ error: null });
    await renderReset();
    await fillAndSubmit();

    await waitFor(() => {
      expect(testState.mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles null/undefined error objects via getErrorMessage fallback', async () => {
    testState.mockUpdateUser.mockRejectedValue(null);
    await renderReset();
    await fillAndSubmit();

    await waitFor(() => {
      expect(testState.mockToastError).toHaveBeenCalledWith('Failed to update password');
    });
    expect(screen.queryByText('Link expired')).toBeNull();
  });

  it('falls back to onAuthStateChange when no hash present', async () => {
    setupHash('');
    const sub = { unsubscribe: vi.fn() };
    let capturedCb: any;
    testState.mockOnAuthStateChange.mockImplementation((cb: any) => {
      capturedCb = cb;
      return { data: { subscription: sub } };
    });

    const ResetPassword = (await import('@/pages/auth/ResetPassword')).default;

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/reset-password'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/reset-password', element: React.createElement(ResetPassword) }),
          React.createElement(Route, { path: '/login', element: React.createElement('div', null, 'login') }),
        ),
      ),
    );

    // Should subscribe to onAuthStateChange
    expect(testState.mockOnAuthStateChange).toHaveBeenCalled();
  });

  it('sets ready when PASSWORD_RECOVERY event fires via onAuthStateChange', async () => {
    setupHash('');
    let capturedCb: any;
    const sub = { unsubscribe: vi.fn() };
    testState.mockOnAuthStateChange.mockImplementation((cb: any) => {
      capturedCb = cb;
      return { data: { subscription: sub } };
    });

    const ResetPassword = (await import('@/pages/auth/ResetPassword')).default;

    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/reset-password'] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, { path: '/reset-password', element: React.createElement(ResetPassword) }),
        ),
      ),
    );

    // Fire PASSWORD_RECOVERY event
    await vi.waitFor(() => {
      expect(capturedCb).toBeDefined();
    });
    capturedCb('PASSWORD_RECOVERY');

    // Form should appear
    await vi.waitFor(() => {
      expect(screen.getByText('Update Password')).toBeTruthy();
    });
  });

  it('shows "invalid session" pattern match triggers linkExpired', async () => {
    testState.mockUpdateUser.mockRejectedValue(new Error('invalid session'));
    await renderReset();
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText('Link expired')).toBeTruthy();
    });
  });
});
