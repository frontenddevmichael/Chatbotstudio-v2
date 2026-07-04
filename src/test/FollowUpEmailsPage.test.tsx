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
  ToggleLeft: () => null,
  ToggleRight: () => null,
  Trash2: () => null,
  Mail: () => null,
  X: () => null,
}));

const FollowUpEmailsPage = React.lazy(() => import('@/pages/dashboard/FollowUpEmailsPage'));

const mockRules = [
  { id: 'rule-1', chatbot_id: 'bot-1', name: 'Abandoned Cart', trigger_type: 'abandoned_cart', trigger_delay_hours: 24, email_subject: 'Still interested?', email_body: 'Hi, we noticed you left...', is_active: true, created_at: '2025-01-01T00:00:00Z' },
];
const mockLogs = [
  { id: 'log-1', rule_id: 'rule-1', conversation_id: 'conv-1', visitor_email: 'test@example.com', sent_at: '2025-01-02T00:00:00Z', opened_at: null, clicked_at: null, status: 'pending' },
];

function mockFrom(table: string) {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => Promise.resolve({ error: null, data: null })),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };

  if (table === 'follow_up_rules') {
    chain.order = vi.fn(() => Promise.resolve({ data: mockRules, error: null }));
    chain.insert = vi.fn(() => Promise.resolve({ error: null, data: null }));
    chain.delete = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
  } else if (table === 'follow_up_log') {
    chain.in = vi.fn(() => ({ ...chain, order: vi.fn(() => ({ ...chain, limit: vi.fn(() => Promise.resolve({ data: mockLogs, error: null })) })) }));
    chain.order = vi.fn(() => ({ ...chain, limit: vi.fn(() => Promise.resolve({ data: mockLogs, error: null })) }));
    chain.limit = vi.fn(() => Promise.resolve({ data: mockLogs, error: null }));
  }

  return chain;
}

describe('FollowUpEmailsPage', () => {
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
      <MemoryRouter initialEntries={['/dashboard/follow-up-emails/bot-1']}>
        <Routes>
          <Route path="/dashboard/follow-up-emails/:chatbotId" element={<React.Suspense fallback={null}><FollowUpEmailsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Autonomous Follow-Up Emails')).toBeTruthy();
    });
  });

  it('shows existing rules', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/follow-up-emails/bot-1']}>
        <Routes>
          <Route path="/dashboard/follow-up-emails/:chatbotId" element={<React.Suspense fallback={null}><FollowUpEmailsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Abandoned Cart')).toBeTruthy();
    });
  });

  it('shows form when Add Rule is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/follow-up-emails/bot-1']}>
        <Routes>
          <Route path="/dashboard/follow-up-emails/:chatbotId" element={<React.Suspense fallback={null}><FollowUpEmailsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Add Rule')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Add Rule'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Abandoned cart follow-up')).toBeTruthy();
    });
  });

  it('shows follow-up log', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/follow-up-emails/bot-1']}>
        <Routes>
          <Route path="/dashboard/follow-up-emails/:chatbotId" element={<React.Suspense fallback={null}><FollowUpEmailsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeTruthy();
      expect(screen.getByText('pending')).toBeTruthy();
    });
  });
});
