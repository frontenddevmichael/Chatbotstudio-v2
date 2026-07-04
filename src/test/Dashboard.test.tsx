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

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useChatbot', () => ({
  useChatbots: vi.fn(),
  useDeleteChatbot: vi.fn(() => ({ mutate: vi.fn() })),
  useDuplicateChatbot: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('@/hooks/useConversations', () => ({
  useAllConversationStats: vi.fn(),
}));

vi.mock('@/hooks/useFAQs', () => ({
  useFAQs: vi.fn(),
  useCreateFAQ: vi.fn(),
  useUpdateFAQ: vi.fn(),
  useDeleteFAQ: vi.fn(),
  useSupercharge: vi.fn(),
}));

vi.mock('@/lib/plans', () => ({
  canCreateChatbot: vi.fn(() => true),
  isPremium: vi.fn(() => false),
  isNearMessageLimit: vi.fn(() => false),
  Profile: {},
}));

vi.mock('@/components/chatbot/BotAvatar', () => ({
  default: () => React.createElement('div', { 'data-testid': 'bot-avatar' }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement('div', null, children),
}));

vi.mock('@/components/layout/PageWrapper', () => ({
  default: ({ children }: any) => React.createElement('div', { 'data-testid': 'page-wrapper' }, children),
}));

vi.mock('@/components/ui/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/ads/AdSidebar', () => ({
  default: () => null,
}));

vi.mock('@/components/billing/UpgradeModal', () => ({
  default: () => null,
}));

vi.mock('@/components/onboarding/OnboardingChecklist', () => ({
  default: () => null,
}));

vi.mock('@/components/chatbot/HealthScore', () => ({
  default: () => null,
  calculateHealthScore: vi.fn(() => 50),
}));

vi.mock('@/components/pwa/InstallBanner', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: () => null,
}));

vi.mock('@/components/ui/illustrations/EmptyState', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/AnimatedCounter', () => ({
  default: ({ value }: any) => React.createElement('span', null, value),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => React.createElement('div', null, children),
  DropdownMenuContent: ({ children }: any) => React.createElement('div', null, children),
  DropdownMenuItem: ({ children, onClick }: any) => React.createElement('button', { onClick }, children),
  DropdownMenuTrigger: ({ children }: any) => React.createElement('div', null, children),
  DropdownMenuSeparator: () => null,
}));

vi.mock('@/components/ui/icons', () => ({
  PlusIcon: () => null,
  ChevronRightIcon: () => null,
  SettingsIcon: () => null,
  LaunchIcon: () => null,
  CopyIcon: () => null,
  TrashIcon: () => null,
}));

describe('Dashboard redirect behavior', () => {
  let useAuth: any;
  let useChatbots: any;
  let useAllConversationStats: any;

  beforeAll(async () => {
    useAuth = (await import('@/context/AuthContext')).useAuth;
    useChatbots = (await import('@/hooks/useChatbot')).useChatbots;
    useAllConversationStats = (await import('@/hooks/useConversations')).useAllConversationStats;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (useChatbots as any).mockReturnValue({ data: [], isLoading: false });
    (useAllConversationStats as any).mockReturnValue({ data: null });
  });

  it('redirects admin to /admin', async () => {
    (useAuth as any).mockReturnValue({
      profile: { id: 'admin-1', plan: 'premium', message_limit: 5000 },
      isAdmin: true,
      loading: false,
    });

    const Dashboard = (await import('@/pages/dashboard/Dashboard')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(Dashboard)));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });
  });

  it('redirects non-admin with pending_wizard to builder', async () => {
    localStorage.setItem('pending_wizard', 'true');
    (useAuth as any).mockReturnValue({
      profile: { id: 'user-1', plan: 'free', message_limit: 500 },
      isAdmin: false,
      loading: false,
    });

    const Dashboard = (await import('@/pages/dashboard/Dashboard')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(Dashboard)));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/builder/new?wizard=1', { replace: true });
    });
  });

  it('does NOT redirect when non-admin without pending_wizard', async () => {
    (useAuth as any).mockReturnValue({
      profile: { id: 'user-1', plan: 'free', message_limit: 500 },
      isAdmin: false,
      loading: false,
    });

    const Dashboard = (await import('@/pages/dashboard/Dashboard')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(Dashboard)));

    await waitFor(() => {
      expect(screen.getByTestId('page-wrapper')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('admin takes priority over pending_wizard', async () => {
    localStorage.setItem('pending_wizard', 'true');
    (useAuth as any).mockReturnValue({
      profile: { id: 'admin-1', plan: 'premium', message_limit: 5000 },
      isAdmin: true,
      loading: false,
    });

    const Dashboard = (await import('@/pages/dashboard/Dashboard')).default;
    render(React.createElement(MemoryRouter, null, React.createElement(Dashboard)));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });
  });
});
