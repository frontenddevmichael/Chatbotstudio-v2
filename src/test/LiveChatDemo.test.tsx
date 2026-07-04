import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}));

vi.mock('@/components/chatbot/BotAvatar', () => ({
  default: ({ botName }: { botName: string }) =>
    React.createElement('div', { 'data-testid': 'bot-avatar' }, botName),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement('div', null, children),
}));

type LiveChatDemoType = React.ComponentType<{ botName?: string; welcomeMessage?: string }>;

describe('LiveChatDemo default props (auto-play)', () => {
  let LiveChatDemo: LiveChatDemoType;

  beforeAll(async () => {
    LiveChatDemo = (await import('@/pages/landing/LiveChatDemo')).default;
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('renders bot name in header and avatar', () => {
    render(React.createElement(LiveChatDemo));
    expect(screen.getAllByText('ShopBot').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('shows "Watching live demo..." during auto-play', () => {
    render(React.createElement(LiveChatDemo));
    expect(screen.getByText('Watching live demo...')).toBeTruthy();
  });

  it('plays first user message after 1s', () => {
    render(React.createElement(LiveChatDemo));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("What are your shop opening hours?")).toBeTruthy();
  });

  it('shows assistant response after full auto-play sequence', async () => {
    render(React.createElement(LiveChatDemo));
    act(() => { vi.advanceTimersByTime(4000); });
    act(() => { vi.advanceTimersByTime(500); });
    await waitFor(() => {
      expect(screen.getByText(/We're open Monday/)).toBeTruthy();
    });
  });
});

describe('LiveChatDemo custom props (wizard preview)', () => {
  let LiveChatDemo: LiveChatDemoType;

  beforeAll(async () => {
    LiveChatDemo = (await import('@/pages/landing/LiveChatDemo')).default;
  });

  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders custom bot name and welcome message immediately', () => {
    render(React.createElement(LiveChatDemo, { botName: 'MyBot', welcomeMessage: 'Hello there!' }));
    expect(screen.getAllByText('MyBot').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Hello there!')).toBeTruthy();
  });

  it('shows interactive input when custom botName provided', () => {
    render(React.createElement(LiveChatDemo, { botName: 'MyBot' }));
    expect(screen.getByPlaceholderText('Try asking something...')).toBeTruthy();
  });

  it('does not show auto-play prompt when custom botName provided', () => {
    render(React.createElement(LiveChatDemo, { botName: 'MyBot' }));
    expect(screen.queryByText('Watching live demo...')).toBeNull();
  });
});
