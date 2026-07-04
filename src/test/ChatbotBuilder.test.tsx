import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

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

const { mockSaveDraft, mockCreateFAQMutation } = vi.hoisted(() => ({
  mockSaveDraft: vi.fn(),
  mockCreateFAQMutation: { mutateAsync: vi.fn() },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: 'user-1', plan: 'free', message_limit: 500 },
  }),
}));

vi.mock('@/hooks/useChatbot', () => ({
  useCreateChatbot: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: 'bot-1' }) }),
  useUpdateChatbot: () => ({ mutateAsync: vi.fn() }),
  useChatbot: () => ({ data: null, isLoading: false }),
  useChatbots: vi.fn(),
}));

vi.mock('@/hooks/useFAQs', () => ({
  useCreateFAQ: () => mockCreateFAQMutation,
}));

vi.mock('@/lib/plans', () => ({
  canCreateChatbot: () => true,
}));

vi.mock('@/lib/sanitize', () => ({
  sanitizeText: (s: string) => s,
}));

vi.mock('@/lib/validations', () => ({
  chatbotNameSchema: { safeParse: () => ({ success: true, data: {} }) },
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

vi.mock('@/components/ui/Spinner', () => ({
  default: () => React.createElement('div', { 'data-testid': 'spinner' }),
}));

vi.mock('@/pages/builder/steps/Step1Identity', () => ({
  default: () => React.createElement('div', { 'data-testid': 'step-1' }),
}));

vi.mock('@/pages/builder/steps/Step2Personality', () => ({
  default: () => React.createElement('div', { 'data-testid': 'step-2' }),
}));

vi.mock('@/pages/builder/steps/Step3Knowledge', () => ({
  default: () => React.createElement('div', { 'data-testid': 'step-3' }),
}));

vi.mock('@/pages/builder/steps/Step4Appearance', () => ({
  default: () => React.createElement('div', { 'data-testid': 'step-4' }),
}));

vi.mock('@/pages/builder/steps/Step5Deploy', () => ({
  default: () => React.createElement('div', { 'data-testid': 'step-5' }),
}));

vi.mock('react-confetti', () => ({
  default: () => null,
}));

vi.mock('@/components/chatbot/BotAvatar', () => ({
  default: () => null,
}));

describe('ChatbotBuilder wizard auto-build', () => {
  let useChatbots: any;

  beforeAll(async () => {
    useChatbots = (await import('@/hooks/useChatbot')).useChatbots;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockCreateFAQMutation.mutateAsync.mockReset();
    (useChatbots as any).mockReturnValue({ data: [] });
  });

  it('does not auto-build without wizard=1 param', async () => {
    localStorage.setItem('landing_wizard_data', JSON.stringify({ name: 'TestBot', welcomeMessage: 'Hi' }));
    const ChatbotBuilder = (await import('@/pages/builder/ChatbotBuilder')).default;

    render(
      React.createElement(MemoryRouter, { initialEntries: ['/builder/new'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/builder/new', element: React.createElement(ChatbotBuilder) }),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-wrapper')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('auto-builds when wizard=1 param present with data in localStorage', async () => {
    localStorage.setItem('landing_wizard_data', JSON.stringify({
      name: 'WizardBot',
      welcomeMessage: 'Welcome!',
      tone: 'friendly',
      faqs: [
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ],
    }));

    const ChatbotBuilder = (await import('@/pages/builder/ChatbotBuilder')).default;
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/builder/new?wizard=1'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/builder/new', element: React.createElement(ChatbotBuilder) }),
          React.createElement(Route, { path: '/chatbot/:id/deploy', element: React.createElement('div', null, 'deploy page') }),
        ),
      ),
    );

    await waitFor(() => {
      expect(localStorage.getItem('pending_wizard')).toBeNull();
    });

    await waitFor(() => {
      expect(localStorage.getItem('landing_wizard_data')).toBeNull();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('does not auto-build when localStorage has no wizard data', async () => {
    const ChatbotBuilder = (await import('@/pages/builder/ChatbotBuilder')).default;
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/builder/new?wizard=1'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/builder/new', element: React.createElement(ChatbotBuilder) }),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-wrapper')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('waits for chatbots query to resolve before auto-building', async () => {
    (useChatbots as any).mockReturnValue({ data: undefined });
    localStorage.setItem('landing_wizard_data', JSON.stringify({ name: 'WaitBot' }));

    const ChatbotBuilder = (await import('@/pages/builder/ChatbotBuilder')).default;
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/builder/new?wizard=1'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/builder/new', element: React.createElement(ChatbotBuilder) }),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-wrapper')).toBeTruthy();
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    (useChatbots as any).mockReturnValue({ data: [] });
  });
});
