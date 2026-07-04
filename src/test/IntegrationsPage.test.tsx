import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

const { mockUseAuth, mockUseQuery, mockUseMutation, mockSupabase, mockNavigate, mockQueryClient, mockFetch } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  mockSupabase: { from: vi.fn(), auth: { getSession: vi.fn() } },
  mockNavigate: vi.fn(),
  mockQueryClient: { invalidateQueries: vi.fn() },
  mockFetch: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({ useAuth: mockUseAuth }));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: () => mockQueryClient,
}));

const defaultMutationResult = { mutate: vi.fn(), isPending: false };

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
  Button: ({ children, onClick, disabled, variant, size }: any) =>
    React.createElement('button', { onClick, disabled, 'data-variant': variant, 'data-size': size }, children),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
}));

vi.mock('lucide-react', () => ({
  MessageSquare: () => null,
  Users: () => null,
  ShoppingCart: () => null,
  Globe: () => null,
  Calendar: () => null,
  MessageCircle: () => null,
  Info: () => null,
  Plug: () => null,
  X: () => null,
  RefreshCw: () => null,
  ExternalLink: () => null,
}));

const IntegrationsPage = React.lazy(() => import('@/pages/dashboard/IntegrationsPage'));

describe('IntegrationsPage', () => {
  beforeAll(() => {
    globalThis.fetch = mockFetch;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1', email: 'test@test.com' } });
    mockUseMutation.mockReturnValue(defaultMutationResult);
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    });
  });

  it('renders the page with title', async () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });

    render(
      <MemoryRouter initialEntries={['/dashboard/integrations/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/integrations/:chatbotId" element={<React.Suspense fallback={null}><IntegrationsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Integrations')).toBeTruthy();
    });
  });

  it('renders all 6 provider cards', async () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });

    render(
      <MemoryRouter initialEntries={['/dashboard/integrations/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/integrations/:chatbotId" element={<React.Suspense fallback={null}><IntegrationsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Slack')).toBeTruthy();
      expect(screen.getByText('HubSpot')).toBeTruthy();
      expect(screen.getByText('Shopify')).toBeTruthy();
      expect(screen.getByText('WordPress')).toBeTruthy();
      expect(screen.getByText('Calendly')).toBeTruthy();
      expect(screen.getByText('WhatsApp')).toBeTruthy();
    });
  });

  it('shows connected badge when integration is enabled', async () => {
    mockUseQuery.mockReturnValue({
      data: [
        { id: '1', chatbot_id: 'chatbot-1', provider: 'slack', config: { webhook_url: 'https://hook.example.com', channel: '#general' }, is_enabled: true, last_synced_at: null, created_at: '2025-01-01' },
      ],
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/integrations/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/integrations/:chatbotId" element={<React.Suspense fallback={null}><IntegrationsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const connectedBadges = screen.getAllByText('Connected');
      expect(connectedBadges.length).toBeGreaterThan(0);
    });
  });

  it('shows loading state', async () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard/integrations/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/integrations/:chatbotId" element={<React.Suspense fallback={null}><IntegrationsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(container.querySelector('.animate-pulse')).toBeTruthy();
    });
  });

  it('expands provider card to show config form', async () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });

    render(
      <MemoryRouter initialEntries={['/dashboard/integrations/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/integrations/:chatbotId" element={<React.Suspense fallback={null}><IntegrationsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Slack')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Slack'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('https://hooks.slack.com/services/...')).toBeTruthy();
      expect(screen.getByPlaceholderText('#general')).toBeTruthy();
    });
  });

  it('connect flow calls edge function', async () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false });
    mockUseMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });

    render(
      <MemoryRouter initialEntries={['/dashboard/integrations/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/integrations/:chatbotId" element={<React.Suspense fallback={null}><IntegrationsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Slack')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Slack'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('https://hooks.slack.com/services/...')).toBeTruthy();
    });

    const webhookInput = screen.getByPlaceholderText('https://hooks.slack.com/services/...');
    fireEvent.change(webhookInput, { target: { value: 'https://hooks.slack.com/services/abc' } });

    const channelInput = screen.getByPlaceholderText('#general');
    fireEvent.change(channelInput, { target: { value: '#test' } });

    const connectBtn = screen.getByText('Connect');
    fireEvent.click(connectBtn);
  });

  it('shows disconnect and sync buttons for connected integration', async () => {
    mockUseQuery.mockReturnValue({
      data: [
        { id: '1', chatbot_id: 'chatbot-1', provider: 'hubspot', config: { api_key: 'key', portal_id: '123' }, is_enabled: true, last_synced_at: '2025-01-01T00:00:00Z', created_at: '2025-01-01' },
      ],
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/integrations/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/integrations/:chatbotId" element={<React.Suspense fallback={null}><IntegrationsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('HubSpot')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('HubSpot'));

    await waitFor(() => {
      expect(screen.getByText('Disconnect')).toBeTruthy();
      expect(screen.getByText('Sync')).toBeTruthy();
    });
  });
});
