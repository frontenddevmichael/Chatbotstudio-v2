import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const { mockAdminFetch } = vi.hoisted(() => ({
  mockAdminFetch: vi.fn(),
}));

vi.mock('@/lib/adminApi', () => ({
  adminFetch: mockAdminFetch,
}));

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

const { mockInvalidateQueries } = vi.hoisted(() => ({
  mockInvalidateQueries: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (v: string) => v,
}));

vi.mock('@/components/layout/PageWrapper', () => ({
  default: ({ children }: any) => React.createElement('div', { 'data-testid': 'page-wrapper' }, children),
}));

vi.mock('@/components/ui/PageLoader', () => ({
  default: () => React.createElement('div', { 'data-testid': 'page-loader' }),
}));

vi.mock('@/components/ui/SEO', () => ({
  default: () => null,
}));

vi.mock('lucide-react', () => ({
  Search: () => React.createElement('div', { 'data-testid': 'search-icon' }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('AdminUsersPage', () => {
  let useAuth: any;
  let useQuery: any;
  let useMutation: any;

  beforeAll(async () => {
    useAuth = (await import('@/context/AuthContext')).useAuth;
    useQuery = (await import('@tanstack/react-query')).useQuery;
    useMutation = (await import('@tanstack/react-query')).useMutation;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminFetch.mockReset();
    mockGetSession.mockReset();
    mockInvalidateQueries.mockReset();
  });

  const mockUsers = [
    { id: 'u1', email: 'alice@test.com', full_name: 'Alice', plan: 'free', email_confirmed: true, created_at: '2025-01-01T00:00:00Z' },
    { id: 'u2', email: 'bob@test.com', full_name: 'Bob', plan: 'premium', email_confirmed: false, created_at: '2025-02-01T00:00:00Z' },
  ];

  const mockBotCounts = { u1: 2, u2: 0 };

  const setupMocks = (overrides?: { confirmEmailMutate?: any }) => {
    (useQuery as any).mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === 'dashboard-admin-users') {
        return { data: mockUsers, isLoading: false };
      }
      if (queryKey[0] === 'dashboard-admin-bot-counts') {
        return { data: mockBotCounts, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });
    (useMutation as any).mockReturnValue({
      mutate: overrides?.confirmEmailMutate ?? vi.fn(),
      isPending: false,
    });
  };

  it('renders user list with email, plan, and chatbot count', async () => {
    (useAuth as any).mockReturnValue({ isAdmin: true, loading: false });
    setupMocks();

    const AdminUsersPage = (await import('@/pages/dashboard/AdminUsersPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(AdminUsersPage)));

    await waitFor(() => {
      expect(screen.getByText('alice@test.com')).toBeTruthy();
    });

    expect(screen.getByText('bob@test.com')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
    expect(screen.getByText('Unverified')).toBeTruthy();
    expect(screen.getByText('free')).toBeTruthy();
    expect(screen.getByText('premium')).toBeTruthy();
  });

  it('filters users by email search', async () => {
    (useAuth as any).mockReturnValue({ isAdmin: true, loading: false });
    setupMocks();
    (useQuery as any).mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === 'dashboard-admin-users') {
        return { data: mockUsers, isLoading: false };
      }
      if (queryKey[0] === 'dashboard-admin-bot-counts') {
        return { data: mockBotCounts, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    const AdminUsersPage = (await import('@/pages/dashboard/AdminUsersPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(AdminUsersPage)));

    await waitFor(() => {
      expect(screen.getByText('alice@test.com')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search by email or name...');
    await act(async () => {
      searchInput.setAttribute('value', 'bob');
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await waitFor(() => {
      expect(screen.queryByText('alice@test.com')).toBeNull();
    });
    expect(screen.getByText('bob@test.com')).toBeTruthy();
  });

  it('shows Confirm Email button for unverified users and hides for verified', async () => {
    (useAuth as any).mockReturnValue({ isAdmin: true, loading: false });
    setupMocks();

    const AdminUsersPage = (await import('@/pages/dashboard/AdminUsersPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(AdminUsersPage)));

    await waitFor(() => {
      expect(screen.getByText('alice@test.com')).toBeTruthy();
    });

    const buttons = screen.getAllByText('Confirm Email');
    expect(buttons).toHaveLength(1);

    const aliceRow = screen.getByText('alice@test.com').closest('tr')!;
    expect(aliceRow.querySelector('button')).toBeNull();

    const bobRow = screen.getByText('bob@test.com').closest('tr')!;
    expect(bobRow.querySelector('button')).toBeTruthy();
  });

  it('calls admin-confirm-email edge function on Confirm Email click', async () => {
    (useAuth as any).mockReturnValue({ isAdmin: true, loading: false });

    const mockMutate = vi.fn();

    const updatedUsers = [
      { id: 'u1', email: 'alice@test.com', full_name: 'Alice', plan: 'free', email_confirmed: false, created_at: '2025-01-01T00:00:00Z' },
    ];

    (useQuery as any).mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === 'dashboard-admin-users') {
        return { data: updatedUsers, isLoading: false };
      }
      if (queryKey[0] === 'dashboard-admin-bot-counts') {
        return { data: { u1: 0 }, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });
    (useMutation as any).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    const AdminUsersPage = (await import('@/pages/dashboard/AdminUsersPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(AdminUsersPage)));

    await waitFor(() => {
      expect(screen.getByText('alice@test.com')).toBeTruthy();
    });

    const confirmBtn = screen.getByText('Confirm Email');
    await act(async () => {
      confirmBtn.click();
    });

    expect(mockMutate).toHaveBeenCalledWith('u1');
  });

  it('shows access denied for non-admin users', async () => {
    (useAuth as any).mockReturnValue({ isAdmin: false, loading: false });
    setupMocks();

    const AdminUsersPage = (await import('@/pages/dashboard/AdminUsersPage')).default;
    const { container } = render(React.createElement(MemoryRouter, { initialEntries: ['/dashboard/admin/users'] }, React.createElement(AdminUsersPage)));

    await waitFor(() => {
      expect(screen.queryByText('User Email Verification')).toBeNull();
    });
  });

  it('shows page loader while auth is loading', async () => {
    (useAuth as any).mockReturnValue({ isAdmin: false, loading: true });
    setupMocks();

    const AdminUsersPage = (await import('@/pages/dashboard/AdminUsersPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(AdminUsersPage)));

    await waitFor(() => {
      expect(screen.getByTestId('page-loader')).toBeTruthy();
    });
  });
});
