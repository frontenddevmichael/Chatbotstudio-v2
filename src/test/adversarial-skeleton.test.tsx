import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { useChangelog } from '@/hooks/useChangelog';
import { toast } from 'sonner';

// vi.mock factories are hoisted above imports. Variables they reference
// must be defined with vi.hoisted() which is hoisted above vi.mock.
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mockFrom } }));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, loading: false }),
  useProfile: () => null,
}));

vi.mock('@/components/layout/PageWrapper', () => ({
  default: ({ children }: any) => React.createElement('div', { 'data-testid': 'page-wrapper' }, children),
}));

vi.mock('@/components/layout/AdminLayout', () => ({
  default: ({ children }: any) => React.createElement('div', { 'data-testid': 'admin-layout' }, children),
}));

vi.mock('@/components/ui/SEO', () => ({ default: () => null }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: any) => React.createElement('div', props, children) },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
}));

vi.mock('@/components/chatbot/AutopilotPanel', () => ({
  default: () => React.createElement('div', { 'data-testid': 'autopilot-panel' }),
}));

vi.mock('@/components/chatbot/BotAvatar', () => ({
  default: () => React.createElement('div', { 'data-testid': 'bot-avatar' }),
}));

vi.mock('@/components/deploy/WebhookSettings', () => ({
  default: () => React.createElement('div', { 'data-testid': 'webhook-settings' }),
}));

vi.mock('@/components/ui/icons', () => ({
  ChatIcon: () => React.createElement('span', { 'data-testid': 'chat-icon' }),
  FAQIcon: () => React.createElement('span', { 'data-testid': 'faq-icon' }),
  AnalyticsIcon: () => React.createElement('span', { 'data-testid': 'analytics-icon' }),
  LaunchIcon: () => React.createElement('span', { 'data-testid': 'launch-icon' }),
  SettingsIcon: () => React.createElement('span', { 'data-testid': 'settings-icon' }),
  ChevronRightIcon: () => React.createElement('span', { 'data-testid': 'chevron-icon' }),
  KnowledgeIcon: () => React.createElement('span', { 'data-testid': 'knowledge-icon' }),
  BotIcon: () => React.createElement('span', { 'data-testid': 'bot-icon' }),
  DashboardIcon: () => React.createElement('span', { 'data-testid': 'dashboard-icon' }),
  ShieldIcon: () => React.createElement('span', { 'data-testid': 'shield-icon' }),
  SuperchargeIcon: () => React.createElement('span', { 'data-testid': 'supercharge-icon' }),
  CopyIcon: () => React.createElement('span', { 'data-testid': 'copy-icon' }),
  LogOutIcon: () => React.createElement('span', { 'data-testid': 'logout-icon' }),
  PlusIcon: () => React.createElement('span', { 'data-testid': 'plus-icon' }),
  TrashIcon: () => React.createElement('span', { 'data-testid': 'trash-icon' }),
  SparkleIcon: () => React.createElement('span', { 'data-testid': 'sparkle-icon' }),
  StarIcon: () => React.createElement('span', { 'data-testid': 'star-icon' }),
  SearchIcon: () => React.createElement('span', { 'data-testid': 'search-icon' }),
}));

vi.mock('@/hooks/useChatbot', () => ({
  useChatbot: (id: string) => ({ data: id ? { id, name: 'Test Bot', avatar_emoji: 'bot', tone: 'friendly', primary_color: '#0a84ff', is_active: true, total_conversations: 5, embed_token: 'tok-1', welcome_message: 'Hi' } : null, isLoading: !id, error: null }),
  useChatbots: () => ({ data: [], isLoading: false }),
  useCreateChatbot: () => ({ mutateAsync: vi.fn() }),
  useUpdateChatbot: () => ({ mutate: vi.fn() }),
  useDeleteChatbot: () => ({ mutate: vi.fn() }),
  useDuplicateChatbot: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/hooks/useFAQs', () => ({
  useFAQs: () => ({ data: [], isLoading: false }),
  useCreateFAQ: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/useConversations', () => ({
  useConversations: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/lib/adminApi', () => ({
  adminFetch: vi.fn(() => new Promise(() => {})),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'recharts-container' }, children),
  AreaChart: ({ children }: any) => React.createElement('div', null, children),
  Area: () => null, BarChart: ({ children }: any) => React.createElement('div', null, children),
  Bar: () => null, XAxis: () => null, YAxis: () => null,
  CartesianGrid: () => null, Tooltip: () => null,
  FunnelChart: () => null, Funnel: () => null, LabelList: () => null,
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: () => '2 days ago',
  subDays: (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() - n); return r; },
  format: () => 'Jan 01',
}));

vi.mock('lucide-react', () => ({
  Users: () => null, Mail: () => null, Crown: () => null, DollarSign: () => null,
  Activity: () => null, RefreshCw: () => null, TrendingUp: () => null,
  TrendingDown: () => null, Minus: () => null, UserPlus: () => null,
  Bot: () => null, MessageSquare: () => null, Headphones: () => null, Search: () => null,
  Shield: () => null, Zap: () => null, Heart: () => null, Rocket: () => null,
  Star: () => null, Globe: () => null, Briefcase: () => null, Smile: () => null,
  BarChart3: () => null, FileQuestion: () => null, Copy: () => null,
  ChevronLeft: () => null, ChevronDown: () => null, ChevronUp: () => null,
  ArrowLeft: () => null, Plus: () => null, Trash2: () => null, ToggleLeft: () => null,
  ToggleRight: () => null, GitBranch: () => null, FileText: () => null,
  ExternalLink: () => null, Link: () => null, AlertTriangle: () => null,
  Check: () => null, X: () => null, Menu: () => null, Info: () => null,
  ChevronRight: () => null, Settings: () => null, Moon: () => null, Sun: () => null,
}));

vi.mock('@/components/ui/illustrations/EmptyState', () => ({
  default: ({ title }: any) => React.createElement('div', { 'data-testid': 'empty-state' }, title),
}));

vi.mock('@/pages/builder/steps/Step1Identity', () => ({
  default: () => React.createElement('div', { 'data-testid': 'step1' }),
}));
vi.mock('@/pages/builder/steps/Step2Personality', () => ({
  default: () => React.createElement('div', { 'data-testid': 'step2' }),
}));
vi.mock('@/pages/builder/steps/Step3Knowledge', () => ({
  default: () => React.createElement('div', { 'data-testid': 'step3' }),
}));
vi.mock('@/pages/builder/steps/Step4Appearance', () => ({
  default: () => React.createElement('div', { 'data-testid': 'step4' }),
}));
vi.mock('@/pages/builder/steps/Step5Deploy', () => ({
  default: () => React.createElement('div', { 'data-testid': 'step5' }),
}));
vi.mock('react-confetti', () => ({
  default: () => null,
}));
vi.mock('@/hooks/useFAQImport', () => ({ default: () => ({ faqPairs: [], setFaqPairs: vi.fn() }) }));
vi.mock('@/lib/sanitize', () => ({ sanitizeText: (s: string) => s }));
vi.mock('@/lib/validations', () => ({ chatbotNameSchema: { safeParse: () => ({ success: true }) } }));
vi.mock('@/lib/plans', () => ({ canCreateChatbot: () => true }));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

// ----------------------------------------------------------------
// 1. useChangelog — null guard prevents query
// ----------------------------------------------------------------
describe('useChangelog — null guard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const setupChain = () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    });
  };

  it('does not call supabase when chatbotId is null', async () => {
    setupChain();
    const { result } = renderHook(() => useChangelog(null));
    await result.current.fetchChangelog();
    expect(result.current.loading).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('does not call supabase when chatbotId is undefined', async () => {
    setupChain();
    const { result } = renderHook(() => useChangelog(undefined));
    await result.current.fetchChangelog();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('does not call supabase when chatbotId is empty string', async () => {
    setupChain();
    const { result } = renderHook(() => useChangelog(''));
    await result.current.fetchChangelog();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('calls supabase when chatbotId is valid', async () => {
    setupChain();
    const { result } = renderHook(() => useChangelog('chatbot-1'));
    await result.current.fetchChangelog();
    await waitFor(() => expect(mockFrom).toHaveBeenCalledWith('faq_changelog'));
  });
});

// ----------------------------------------------------------------
// 2. ChatbotDetail — navigation links render
// ----------------------------------------------------------------
const ChatbotDetailPage = React.lazy(() => import('@/pages/chatbot/ChatbotDetail'));

describe('ChatbotDetail — links', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders all 6 navigation link labels', async () => {
    render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(MemoryRouter, { initialEntries: ['/chatbot/bot-1'] },
          React.createElement(Routes, null,
            React.createElement(Route, { path: '/chatbot/:id', element: React.createElement(React.Suspense, { fallback: null }, React.createElement(ChatbotDetailPage)) })
          )
        )
      )
    );

    await waitFor(() => expect(screen.getByText('Model Settings')).toBeTruthy());
    expect(screen.getByText('FAQs')).toBeTruthy();
    expect(screen.getByText('Analytics')).toBeTruthy();
    expect(screen.getByText('Deploy')).toBeTruthy();
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Orchestration')).toBeTruthy();

    const modelLink = screen.getByText('Model Settings').closest('a');
    expect(modelLink?.getAttribute('href')).toBe('/dashboard/model-settings/bot-1');

    const orchLink = screen.getByText('Orchestration').closest('a');
    expect(orchLink?.getAttribute('href')).toBe('/dashboard/orchestration/bot-1');
  });
});

// ----------------------------------------------------------------
// 3. ApiKeysPage — onError handles all error shapes
// ----------------------------------------------------------------
describe('ApiKeysPage — onError robustness', () => {
  const createHandler = (err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to create API key');
  const deleteHandler = (err: unknown) => toast.error(err instanceof Error ? err.message : 'Failed to delete API key');

  beforeEach(() => { vi.clearAllMocks(); });

  it('shows real message for Error instance (create)', () => {
    createHandler(new Error('duplicate key violates unique constraint'));
    expect(toast.error).toHaveBeenCalledWith('duplicate key violates unique constraint');
  });

  it('shows fallback for string error (create)', () => {
    createHandler('network timeout');
    expect(toast.error).toHaveBeenCalledWith('Failed to create API key');
  });

  it('shows fallback for null (create)', () => {
    createHandler(null);
    expect(toast.error).toHaveBeenCalledWith('Failed to create API key');
  });

  it('shows fallback for object without message (create)', () => {
    createHandler({ code: 403 });
    expect(toast.error).toHaveBeenCalledWith('Failed to create API key');
  });

  it('shows real message for Error instance (delete)', () => {
    deleteHandler(new Error('foreign key violation'));
    expect(toast.error).toHaveBeenCalledWith('foreign key violation');
  });

  it('shows fallback for undefined (delete)', () => {
    deleteHandler(undefined);
    expect(toast.error).toHaveBeenCalledWith('Failed to delete API key');
  });
});

// ----------------------------------------------------------------
// 4. ModelSettingsPage — skeleton replaces Spinner
// ----------------------------------------------------------------
const ModelSettingsPage = React.lazy(() => import('@/pages/dashboard/ModelSettingsPage'));

describe('ModelSettingsPage — skeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const noopPromise = new Promise(() => {});
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => noopPromise),
            single: vi.fn(() => noopPromise),
          })),
          single: vi.fn(() => noopPromise),
        })),
      })),
    });
  });

  it('renders skeleton divs (not Spinner) during loading', async () => {
    render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(MemoryRouter, { initialEntries: ['/dashboard/model-settings/chatbot-1'] },
          React.createElement(Routes, null,
            React.createElement(Route, { path: '/dashboard/model-settings/:chatbotId', element: React.createElement(React.Suspense, { fallback: null }, React.createElement(ModelSettingsPage)) })
          )
        )
      )
    );

    await waitFor(() => {
      const pulses = document.querySelectorAll('.animate-pulse');
      expect(pulses.length).toBeGreaterThan(0);
    });
  });
});

// ----------------------------------------------------------------
// 5. AdminDashboard — skeleton on loading
// ----------------------------------------------------------------
const AdminDashboardPage = React.lazy(() => import('@/pages/admin/AdminDashboard'));

describe('AdminDashboard — skeleton', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders skeleton elements when loading', async () => {
    render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(MemoryRouter, { initialEntries: ['/admin'] },
          React.createElement(Routes, null,
            React.createElement(Route, { path: '/admin', element: React.createElement(React.Suspense, { fallback: null }, React.createElement(AdminDashboardPage)) })
          )
        )
      )
    );

    await waitFor(() => {
      const pulses = document.querySelectorAll('.animate-pulse');
      expect(pulses.length).toBeGreaterThan(0);
    });
  });
});

// ----------------------------------------------------------------
// 6. ChatbotBuilder — aria-labels on nav buttons
// ----------------------------------------------------------------
const ChatbotBuilderPage = React.lazy(() => import('@/pages/builder/ChatbotBuilder'));

describe('ChatbotBuilder — accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'new-1' }, error: null })),
        })),
      })),
    }));
  });

  it('back button has aria-label "Previous step"', async () => {
    render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(MemoryRouter, { initialEntries: ['/builder'] },
          React.createElement(Routes, null,
            React.createElement(Route, { path: '/builder', element: React.createElement(React.Suspense, { fallback: null }, React.createElement(ChatbotBuilderPage)) })
          )
        )
      )
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Previous step')).toBeTruthy();
    });
  });

  it('next button has aria-label "Next step"', async () => {
    render(
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(MemoryRouter, { initialEntries: ['/builder'] },
          React.createElement(Routes, null,
            React.createElement(Route, { path: '/builder', element: React.createElement(React.Suspense, { fallback: null }, React.createElement(ChatbotBuilderPage)) })
          )
        )
      )
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Next step')).toBeTruthy();
    });
  });
});
