import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

const { mockUseAuth, mockUseQuery, mockUseMutation, mockSupabase, mockNavigate, mockQueryClient } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
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

vi.mock('@/components/ui/badge', () => ({ Badge: ({ children, className }: any) => React.createElement('span', { 'data-testid': 'badge', className }, children) }));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant }: any) =>
    React.createElement('button', { onClick, disabled, 'data-variant': variant }, children),
}));

vi.mock('@/components/ui/icons', () => ({
  PlusIcon: () => null,
  TrashIcon: () => null,
  PencilIcon: () => null,
  XIcon: () => null,
  CheckIcon: () => null,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
}));

vi.mock('lucide-react', () => ({
  BarChart3: () => null,
  FlaskConical: () => null,
  Info: () => null,
  Pencil: () => null,
  X: () => null,
}));

const ABTestingPage = React.lazy(() => import('@/pages/dashboard/ABTestingPage'));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/dashboard/ab-testing/chatbot-1']}>
    <Routes>
      <Route path="/dashboard/ab-testing/:chatbotId" element={<React.Suspense fallback={null}><ABTestingPage /></React.Suspense>} />
    </Routes>
  </MemoryRouter>
);

describe('ABTestingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    });
  });

  it('renders the page with title', async () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('A/B Testing')).toBeTruthy();
    });
  });

  it('shows empty state when no variants exist', async () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('No variants yet')).toBeTruthy();
    });
  });

  it('shows loading state', async () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = renderPage();

    await waitFor(() => {
      expect(container.querySelector('.animate-pulse')).toBeTruthy();
    });
  });

  it('renders variants list', async () => {
    const mockVariants = [
      { id: 'v1', chatbot_id: 'chatbot-1', name: 'Friendly V2', tone: 'friendly', welcome_message: 'Hey there!', ai_model: null, system_prompt_override: null, traffic_percentage: 50, is_active: true, created_at: '2025-01-01' },
      { id: 'v2', chatbot_id: 'chatbot-1', name: 'Professional', tone: 'professional', welcome_message: 'Hello, how may I assist you?', ai_model: null, system_prompt_override: null, traffic_percentage: 30, is_active: true, created_at: '2025-02-01' },
    ];

    mockUseQuery.mockReturnValue({ data: mockVariants, isLoading: false });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Friendly V2').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Professional').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('create variant form opens and creates variant', async () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });

    const mockMutate = vi.fn();
    mockUseMutation.mockReturnValue({ mutate: mockMutate, isPending: false });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Create Variant')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Create Variant'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Friendly Tone V2')).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText('e.g. Friendly Tone V2');
    fireEvent.change(nameInput, { target: { value: 'Test Variant' } });

    const createBtn = screen.getByText('Create');
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  it('shows traffic split visualization', async () => {
    const mockVariants = [
      { id: 'v1', chatbot_id: 'chatbot-1', name: 'A', tone: null, welcome_message: null, ai_model: null, system_prompt_override: null, traffic_percentage: 60, is_active: true, created_at: '2025-01-01' },
      { id: 'v2', chatbot_id: 'chatbot-1', name: 'B', tone: null, welcome_message: null, ai_model: null, system_prompt_override: null, traffic_percentage: 40, is_active: true, created_at: '2025-02-01' },
    ];

    mockUseQuery.mockReturnValue({ data: mockVariants, isLoading: false });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Traffic Split')).toBeTruthy();
      expect(screen.getByText('60%')).toBeTruthy();
      expect(screen.getByText('40%')).toBeTruthy();
    });
  });

  it('delete variant calls delete mutation', async () => {
    const mockVariants = [
      { id: 'v1', chatbot_id: 'chatbot-1', name: 'Test Variant', tone: null, welcome_message: null, ai_model: null, system_prompt_override: null, traffic_percentage: 50, is_active: true, created_at: '2025-01-01' },
    ];

    mockUseQuery.mockReturnValue({ data: mockVariants, isLoading: false });

    const deleteMutate = vi.fn();
    mockUseMutation.mockReturnValue({ mutate: deleteMutate, isPending: false });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Test Variant').length).toBeGreaterThanOrEqual(1);
    });

    const deleteBtn = screen.getByLabelText('Delete Test Variant');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(deleteMutate).toHaveBeenCalledWith('v1');
    });

    confirmSpy.mockRestore();
  });
});
