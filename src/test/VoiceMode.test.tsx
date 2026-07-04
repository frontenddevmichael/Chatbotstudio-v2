import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { MockSpeechRecognition, mockStart, mockAbort } = vi.hoisted(() => {
  const start = vi.fn();
  const abort = vi.fn();
  class MockSpeechRecognition implements SpeechRecognition {
    lang = '';
    interimResults = false;
    continuous = false;
    onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;
    onend: (() => void) | null = null;
    start = start;
    stop = vi.fn();
    abort = abort;
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    dispatchEvent = vi.fn();
  }
  return { MockSpeechRecognition, mockStart: start, mockAbort: abort };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ embedToken: 'test-token' }),
  };
});

function mockQueryBuilder() {
  const b: any = {
    select: vi.fn(() => b),
    eq: vi.fn(() => b),
    order: vi.fn(() => b),
    limit: vi.fn(() => b),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve: any) => resolve({ data: null, error: null })),
  };
  return b;
}

vi.mock('@/integrations/supabase/client', () => {
  const queryBuilder = mockQueryBuilder();
  return {
    supabase: {
      rpc: vi.fn().mockResolvedValue({ data: [{ id: 'bot-1', name: 'TestBot', primary_color: '#0a84ff', welcome_message: 'Hello!', tone: 'friendly', is_active: true }], error: null }),
      from: vi.fn(() => mockQueryBuilder()),
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: { response: 'Hi there!' }, error: null }),
      },
    },
  };
});

vi.mock('@/lib/sanitize', () => ({
  sanitizeText: (s: string) => s,
  sanitizeHTML: (s: string) => s,
}));

vi.mock('@/components/ui/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/ErrorBoundary', () => ({
  default: ({ children }: any) => React.createElement('div', null, children),
}));

vi.mock('@/components/chatbot/BotAvatar', () => ({
  default: () => null,
}));

describe('VoiceMode', () => {
  beforeAll(() => {
    vi.stubEnv('VITE_ENABLE_VOICE', 'true');
    window.SpeechRecognition = MockSpeechRecognition as unknown as new () => SpeechRecognition;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    window.SpeechRecognition = MockSpeechRecognition as unknown as new () => SpeechRecognition;
  });

  it('renders mic button when voice is enabled', async () => {
    const WidgetPage = (await import('@/pages/widget/WidgetPage')).default;
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/widget/test-token'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/widget/:embedToken', element: React.createElement(WidgetPage) }),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Start voice input')).toBeTruthy();
    });
  });

  it('clicking mic button starts speech recognition', async () => {
    const WidgetPage = (await import('@/pages/widget/WidgetPage')).default;
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/widget/test-token'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/widget/:embedToken', element: React.createElement(WidgetPage) }),
        ),
      ),
    );

    const micButton = await screen.findByLabelText('Start voice input');
    await act(async () => {
      micButton.click();
    });

    expect(mockStart).toHaveBeenCalledOnce();
  });

  it('shows stop button while recording', async () => {
    const WidgetPage = (await import('@/pages/widget/WidgetPage')).default;
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/widget/test-token'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/widget/:embedToken', element: React.createElement(WidgetPage) }),
        ),
      ),
    );

    const micButton = await screen.findByLabelText('Start voice input');
    await act(async () => {
      micButton.click();
    });

    expect(screen.getByLabelText('Stop recording')).toBeTruthy();
  });

  it('hides mic button when voice is disabled via env var', async () => {
    vi.stubEnv('VITE_ENABLE_VOICE', 'false');
    const WidgetPage = (await import('@/pages/widget/WidgetPage')).default;
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/widget/test-token'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/widget/:embedToken', element: React.createElement(WidgetPage) }),
        ),
      ),
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Start voice input')).toBeNull();
    });

    vi.stubEnv('VITE_ENABLE_VOICE', 'true');
  });

  it('renders speaker button on assistant messages', async () => {
    const WidgetPage = (await import('@/pages/widget/WidgetPage')).default;
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/widget/test-token'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/widget/:embedToken', element: React.createElement(WidgetPage) }),
        ),
      ),
    );

    await waitFor(() => {
      const speakerButtons = screen.queryAllByLabelText('Read message aloud');
      expect(speakerButtons.length).toBeGreaterThan(0);
    });
  });

  it('cleans up recognition on unmount', async () => {
    const WidgetPage = (await import('@/pages/widget/WidgetPage')).default;
    const { unmount } = render(
      React.createElement(MemoryRouter, { initialEntries: ['/widget/test-token'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/widget/:embedToken', element: React.createElement(WidgetPage) }),
        ),
      ),
    );

    const micButton = await screen.findByLabelText('Start voice input');
    await act(async () => {
      micButton.click();
    });

    unmount();

    expect(mockAbort).toHaveBeenCalled();
  });
});
