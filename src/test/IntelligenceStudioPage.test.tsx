import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

const { mockSupabase, mockFetch } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    auth: { getSession: vi.fn() },
  },
  mockFetch: vi.fn(),
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
  Search: () => null,
  Download: () => null,
  Tag: () => null,
  MessageSquare: () => null,
  User: () => null,
  Bot: () => null,
  Info: () => null,
  X: () => null,
  Plus: () => null,
  Calendar: () => null,
}));

const IntelligenceStudioPage = React.lazy(() => import('@/pages/dashboard/IntelligenceStudioPage'));

const mockConversations = [
  {
    id: 'conv-1',
    chatbot_id: 'bot-1',
    session_id: 'session-1',
    visitor_id: 'visitor-1',
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ],
    started_at: '2025-01-01T00:00:00Z',
    last_message_at: '2025-01-01T00:05:00Z',
  },
];

function mockFrom(table: string) {
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => Promise.resolve({ error: null, data: null })),
    delete: vi.fn(() => Promise.resolve({ error: null, data: null })),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };

  if (table === 'conversations') {
    chain.order = vi.fn(() => ({ ...chain, limit: vi.fn(() => Promise.resolve({ data: mockConversations, error: null })) }));
    chain.limit = vi.fn(() => Promise.resolve({ data: mockConversations, error: null }));
    chain.eq = vi.fn(() => chain);
  } else if (table === 'conversation_tags') {
    chain.in = vi.fn(() => Promise.resolve({ data: [], error: null }));
    chain.eq = vi.fn(() => Promise.resolve({ data: [], error: null }));
    chain.insert = vi.fn(() => Promise.resolve({ error: null, data: null }));
    chain.delete = vi.fn(() => Promise.resolve({ error: null, data: null }));
  } else if (table === 'conversation_annotations') {
    chain.eq = vi.fn(() => ({ ...chain, order: vi.fn(() => Promise.resolve({ data: [], error: null })) }));
    chain.order = vi.fn(() => Promise.resolve({ data: [], error: null }));
    chain.insert = vi.fn(() => Promise.resolve({ error: null, data: null }));
  }

  return chain;
}

describe('IntelligenceStudioPage', () => {
  let useAuth: any;

  beforeAll(async () => {
    useAuth = (await import('@/context/AuthContext')).useAuth;
    globalThis.fetch = mockFetch;
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
      <MemoryRouter initialEntries={['/dashboard/intelligence-studio/bot-1']}>
        <Routes>
          <Route path="/dashboard/intelligence-studio/:chatbotId" element={<React.Suspense fallback={null}><IntelligenceStudioPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Conversation Intelligence Studio')).toBeTruthy();
    });
  });

  it('shows conversation list', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/intelligence-studio/bot-1']}>
        <Routes>
          <Route path="/dashboard/intelligence-studio/:chatbotId" element={<React.Suspense fallback={null}><IntelligenceStudioPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/session-1/)).toBeTruthy();
    });
  });

  it('opens session replay when conversation is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/intelligence-studio/bot-1']}>
        <Routes>
          <Route path="/dashboard/intelligence-studio/:chatbotId" element={<React.Suspense fallback={null}><IntelligenceStudioPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/session-1/)).toBeTruthy();
    });

    fireEvent.click(screen.getByText(/session-1/));

    await waitFor(() => {
      expect(screen.getByText('Session Replay')).toBeTruthy();
      expect(screen.getByText('Hello')).toBeTruthy();
      expect(screen.getByText('Hi there!')).toBeTruthy();
    });
  });

  it('allows adding an annotation', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      const chain: any = {
        select: vi.fn(() => chain),
        insert: vi.fn(() => Promise.resolve({ error: null, data: null })),
        delete: vi.fn(() => Promise.resolve({ error: null, data: null })),
        eq: vi.fn(() => chain),
        in: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      };

      if (table === 'conversations') {
        chain.order = vi.fn(() => ({ ...chain, limit: vi.fn(() => Promise.resolve({ data: mockConversations, error: null })) }));
        chain.limit = vi.fn(() => Promise.resolve({ data: mockConversations, error: null }));
        chain.eq = vi.fn(() => chain);
      } else if (table === 'conversation_tags') {
        chain.in = vi.fn(() => Promise.resolve({ data: [], error: null }));
        chain.eq = vi.fn(() => Promise.resolve({ data: [], error: null }));
      } else if (table === 'conversation_annotations') {
        chain.eq = vi.fn(() => ({ ...chain, order: vi.fn(() => Promise.resolve({ data: [], error: null })) }));
        chain.order = vi.fn(() => Promise.resolve({ data: [], error: null }));
      }

      return chain;
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/intelligence-studio/bot-1']}>
        <Routes>
          <Route path="/dashboard/intelligence-studio/:chatbotId" element={<React.Suspense fallback={null}><IntelligenceStudioPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/session-1/)).toBeTruthy();
    });

    fireEvent.click(screen.getByText(/session-1/));

    await waitFor(() => {
      expect(screen.getByText('Session Replay')).toBeTruthy();
    });

    const annotateButtons = screen.getAllByText('+ Annotate');
    fireEvent.click(annotateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Add Annotation/)).toBeTruthy();
    });
  });
});
