import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/layout/PageWrapper', () => ({
  default: ({ children }: any) => React.createElement('div', { 'data-testid': 'page-wrapper' }, children),
}));

vi.mock('@/components/ui/SEO', () => ({ default: () => null }));

vi.mock('@/components/ui/Spinner', () => ({
  default: () => React.createElement('div', { 'data-testid': 'spinner' }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  Info: () => null,
  Plus: () => null,
  ChevronUp: () => null,
  ChevronDown: () => null,
  Trash2: () => null,
  ToggleLeft: () => null,
  ToggleRight: () => null,
  X: () => null,
}));

const OrchestrationPage = React.lazy(() => import('@/pages/dashboard/OrchestrationPage'));

const mockBot = { id: 'bot-1', name: 'Sales Bot' };
const mockBots = [
  { id: 'bot-2', name: 'Support Bot' },
  { id: 'bot-3', name: 'FAQ Bot' },
];
const mockRules = [
  { id: 'rule-1', chatbot_id: 'bot-1', name: 'Route Sales', condition_type: 'keyword', condition_value: 'buy, price', target_chatbot_id: 'bot-2', priority: 0, is_active: true, created_at: '2025-01-01T00:00:00Z' },
];
const mockTransfers = [
  { id: 'transfer-1', conversation_id: 'conv-1', from_chatbot_id: 'bot-1', to_chatbot_id: 'bot-2', reason: 'Keyword match: buy', created_at: '2025-01-01T00:00:00Z' },
];

function mockFrom(table: string) {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => Promise.resolve({ error: null, data: null })),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };

  if (table === 'chatbots') {
    chain.single = vi.fn(() => Promise.resolve({ data: mockBot, error: null }));
    const allBots: any = { ...chain, eq: vi.fn(() => ({ ...chain, order: vi.fn(() => Promise.resolve({ data: mockBots, error: null })) })) };
    chain.neq = vi.fn(() => allBots);
  } else if (table === 'orchestration_rules') {
    chain.order = vi.fn(() => Promise.resolve({ data: mockRules, error: null }));
    chain.insert = vi.fn(() => Promise.resolve({ error: null, data: null }));
    chain.delete = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
  } else if (table === 'conversation_transfers') {
    chain.or = vi.fn(() => ({ ...chain, order: vi.fn(() => ({ ...chain, limit: vi.fn(() => Promise.resolve({ data: mockTransfers, error: null })) })) }));
    chain.order = vi.fn(() => ({ ...chain, limit: vi.fn(() => Promise.resolve({ data: mockTransfers, error: null })) }));
    chain.limit = vi.fn(() => Promise.resolve({ data: mockTransfers, error: null }));
  }

  return chain;
}

describe('OrchestrationPage', () => {
  let useAuth: any;

  beforeAll(async () => {
    useAuth = (await import('@/context/AuthContext')).useAuth;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { id: 'user-1', email: 'test@test.com' } });
    mockSupabase.from = vi.fn(mockFrom);
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'mock-token' } },
      error: null,
    });
  });

  it('renders the page with title', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/orchestration/bot-1']}>
        <Routes>
          <Route path="/dashboard/orchestration/:chatbotId" element={<React.Suspense fallback={null}><OrchestrationPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Multi-Bot Orchestration')).toBeTruthy();
    });
  });

  it('shows existing rules', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/orchestration/bot-1']}>
        <Routes>
          <Route path="/dashboard/orchestration/:chatbotId" element={<React.Suspense fallback={null}><OrchestrationPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Route Sales')).toBeTruthy();
    });
  });

  it('shows form when Add Rule is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/orchestration/bot-1']}>
        <Routes>
          <Route path="/dashboard/orchestration/:chatbotId" element={<React.Suspense fallback={null}><OrchestrationPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Add Rule')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Add Rule'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Route sales inquiries')).toBeTruthy();
    });
  });
});
