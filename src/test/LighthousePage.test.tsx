import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));

vi.mock('lucide-react', () => ({
  Info: () => null,
  Search: () => null,
  X: () => null,
  Sparkles: () => null,
  ExternalLink: () => null,
  RefreshCw: () => null,
  Clock: () => null,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { access_token: 'mock-token' } }, error: null })
      ),
    },
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/layout/PageWrapper', () => ({
  default: ({ children }: any) => React.createElement('div', { 'data-testid': 'page-wrapper' }, children),
}));

vi.mock('@/components/ui/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/Spinner', () => ({
  default: () => React.createElement('div', { 'data-testid': 'spinner' }),
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) =>
    React.createElement('div', { 'data-testid': 'progress', 'data-value': value, className }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const LighthousePage = React.lazy(() => import('@/pages/dashboard/LighthousePage'));

describe('LighthousePage', () => {
  let useAuth: any;

  beforeAll(async () => {
    useAuth = (await import('@/context/AuthContext')).useAuth;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { id: 'user-1', email: 'test@test.com' } });
    globalThis.fetch = mockFetch;
  });

  it('renders the page with title', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/lighthouse/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/lighthouse/:chatbotId" element={<React.Suspense fallback={null}><LighthousePage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Lighthouse Performance')).toBeTruthy();
    });
  });

  it('shows empty state when no audits exist', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/lighthouse/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/lighthouse/:chatbotId" element={<React.Suspense fallback={null}><LighthousePage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No audits yet/)).toBeTruthy();
    });
  });

  it('calls the edge function when Run Audit is clicked', async () => {
    const mockScore = {
      id: 'score-1',
      chatbot_id: 'chatbot-1',
      url: 'https://example.com',
      performance: 95,
      accessibility: 82,
      best_practices: 78,
      seo: 100,
      pwa: 65,
      score_json: {},
      created_at: new Date().toISOString(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockScore,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard/lighthouse/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/lighthouse/:chatbotId" element={<React.Suspense fallback={null}><LighthousePage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('https://example.com')).toBeTruthy();
    });

    const input = screen.getByPlaceholderText('https://example.com');
    fireEvent.change(input, { target: { value: 'https://example.com' } });

    const button = screen.getByText('Run Audit');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('/functions/v1/lighthouse-audit');
    });
  });
});
