import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => React.createElement(React.Fragment, null, children),
  HelmetProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

const testState = vi.hoisted(() => ({
  mockResetPasswordForEmail: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: any[]) => testState.mockResetPasswordForEmail(...args),
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

describe('ForgotPassword — email pre-fill from query param', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderForgotPassword(route = '/forgot-password') {
    const ForgotPassword = React.lazy(() => import('@/pages/auth/ForgotPassword'));
    return render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [route] },
        React.createElement(
          Routes,
          null,
          React.createElement(Route, {
            path: '/forgot-password',
            element: React.createElement(React.Suspense, { fallback: null }, React.createElement(ForgotPassword)),
          }),
          React.createElement(Route, { path: '/login', element: React.createElement('div', null, 'login') }),
        ),
      ),
    );
  }

  it('pre-fills email field when ?email= query param is present', async () => {
    renderForgotPassword('/forgot-password?email=test%40example.com');

    await waitFor(() => {
      const input = screen.getByLabelText('Email') as HTMLInputElement;
      expect(input.value).toBe('test@example.com');
    });
  });

  it('shows migration context note when ?email= is present', async () => {
    renderForgotPassword('/forgot-password?email=test%40example.com');

    await waitFor(() => {
      expect(screen.getByText(/before our latest database upgrade/i)).toBeTruthy();
    });
  });

  it('does not show migration note when visiting directly', async () => {
    renderForgotPassword('/forgot-password');

    await waitFor(() => {
      expect(screen.queryByText(/before our latest database upgrade/i)).toBeNull();
    });
  });

  it('leaves email field empty when no ?email= param', async () => {
    renderForgotPassword('/forgot-password');

    await waitFor(() => {
      const input = screen.getByLabelText('Email') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  it('shows toast on empty email submit', async () => {
    renderForgotPassword('/forgot-password');

    const btn = await screen.findByText('Send Reset Link');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(testState.mockToastError).toHaveBeenCalledWith('Please enter your email');
    });
  });

  it('calls resetPasswordForEmail with redirectTo=/auth/callback', async () => {
    testState.mockResetPasswordForEmail.mockResolvedValue({ error: null });
    renderForgotPassword('/forgot-password?email=test%40example.com');

    const btn = await screen.findByText('Send Reset Link');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(testState.mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/auth/callback'),
      });
    });
  });

  it('shows success toast after successful reset email send', async () => {
    testState.mockResetPasswordForEmail.mockResolvedValue({ error: null });
    renderForgotPassword('/forgot-password?email=test%40example.com');

    const btn = await screen.findByText('Send Reset Link');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(testState.mockToastSuccess).toHaveBeenCalledWith('Check your email for a reset link');
    });
  });

  it('shows error toast on API failure', async () => {
    testState.mockResetPasswordForEmail.mockRejectedValue(new Error('Rate limited'));
    renderForgotPassword('/forgot-password?email=test%40example.com');

    const btn = await screen.findByText('Send Reset Link');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(testState.mockToastError).toHaveBeenCalledWith('Rate limited');
    });
  });
});
