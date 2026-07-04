import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const { mockUseAuth, mockUseQuery, mockUseMutation, mockSupabase, mockNavigate, mockQueryClient } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
  mockSupabase: { from: vi.fn() },
  mockNavigate: vi.fn(),
  mockQueryClient: { invalidateQueries: vi.fn() },
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: mockUseAuth }));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: () => mockQueryClient,
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/components/layout/PageWrapper', () => ({
  default: ({ children }: any) => React.createElement('div', { 'data-testid': 'page-wrapper' }, children),
}));

vi.mock('@/components/ui/SEO', () => ({ default: () => null }));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/components/ui/badge', () => ({ Badge: ({ children }: any) => React.createElement('span', { 'data-testid': 'badge' }, children) }));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant }: any) =>
    React.createElement('button', { onClick, disabled, 'data-variant': variant }, children),
}));

vi.mock('@/components/ui/icons', () => ({
  PlusIcon: () => null,
  TrashIcon: () => null,
  CopyIcon: () => null,
}));

describe('ApiKeysPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    });
  });

  it('renders API keys list', async () => {
    const mockKeys = [
      { id: '1', user_id: 'user-1', name: 'Production', key: 'sk-abc123', scopes: ['read'], last_used_at: null, is_active: true, created_at: '2025-01-01' },
      { id: '2', user_id: 'user-1', name: 'Staging', key: 'sk-xyz789', scopes: ['read', 'write'], last_used_at: '2025-06-01', is_active: true, created_at: '2025-02-01' },
    ];

    mockUseQuery.mockReturnValue({ data: mockKeys, isLoading: false });

    const ApiKeysPage = (await import('@/pages/dashboard/ApiKeysPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(ApiKeysPage)));

    await waitFor(() => {
      expect(screen.getByText('Production')).toBeTruthy();
      expect(screen.getByText('Staging')).toBeTruthy();
    });
  });

  it('shows empty state when no keys exist', async () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });

    const ApiKeysPage = (await import('@/pages/dashboard/ApiKeysPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(ApiKeysPage)));

    await waitFor(() => {
      expect(screen.getByText('No API keys yet')).toBeTruthy();
    });
  });

  it('shows loading state', async () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

    const ApiKeysPage = (await import('@/pages/dashboard/ApiKeysPage')).default;
    const { container } = render(React.createElement(MemoryRouter, null, React.createElement(ApiKeysPage)));

    await waitFor(() => {
      expect(container.querySelector('.animate-pulse')).toBeTruthy();
    });
  });

  it('create key flow', async () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });

    const mockMutate = vi.fn();
    mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });

    const ApiKeysPage = (await import('@/pages/dashboard/ApiKeysPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(ApiKeysPage)));

    const createBtn = screen.getByText('Create Key');
    fireEvent.click(createBtn);

    const input = screen.getByPlaceholderText('Key name (e.g. Production, Staging)');
    fireEvent.change(input, { target: { value: 'My Key' } });

    const generateBtn = screen.getByText('Generate');
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith('My Key');
    });
  });

  it('shows created key after generation', async () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });

    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    const ApiKeysPage = (await import('@/pages/dashboard/ApiKeysPage')).default;
    const { rerender } = render(React.createElement(MemoryRouter, null, React.createElement(ApiKeysPage)));

    const createBtn = screen.getByText('Create Key');
    fireEvent.click(createBtn);

    mockUseQuery.mockReturnValue({
      data: [{ id: '1', user_id: 'user-1', name: 'My Key', key: 'new-key-123', scopes: [], last_used_at: null, is_active: true, created_at: '2025-01-01' }],
      isLoading: false,
    });

    const input = screen.getByPlaceholderText('Key name (e.g. Production, Staging)');
    fireEvent.change(input, { target: { value: 'My Key' } });
    fireEvent.click(screen.getByText('Generate'));

    rerender(React.createElement(MemoryRouter, null, React.createElement(ApiKeysPage)));
  });

  it('renders scopes as badges', async () => {
    const mockKeys = [
      { id: '1', user_id: 'user-1', name: 'Test', key: 'sk-test', scopes: ['read', 'write', 'admin'], last_used_at: null, is_active: true, created_at: '2025-01-01' },
    ];

    mockUseQuery.mockReturnValue({ data: mockKeys, isLoading: false });

    const ApiKeysPage = (await import('@/pages/dashboard/ApiKeysPage')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(ApiKeysPage)));

    await waitFor(() => {
      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(3);
    });
  });
});
