import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
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

const { mockSignUp } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-intersection-observer', () => ({
  useInView: () => [{ current: null }, true],
}));

vi.mock('@/lib/validations', () => ({
  chatbotNameSchema: {
    safeParse: (name: string) => {
      if (!name || name.trim().length < 2) {
        return { success: false, error: { errors: [{ message: 'Name must be at least 2 characters' }] } };
      }
      return { success: true, data: {} };
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
    p: ({ children, ...props }: any) => React.createElement('p', props, children),
    h2: ({ children, ...props }: any) => React.createElement('h2', props, children),
  },
  AnimatePresence: ({ children }: any) => React.createElement('div', null, children),
}));

vi.mock('@/pages/landing/LiveChatDemo', () => ({
  default: ({ botName, welcomeMessage }: any) =>
    React.createElement('div', { 'data-testid': 'live-chat-demo' }, `${botName}: ${welcomeMessage}`),
}));

type LandingWizardType = React.ComponentType<{}>;

describe('LandingWizard new user signup flow', () => {
  let LandingWizard: LandingWizardType;
  let useAuth: any;

  beforeAll(async () => {
    LandingWizard = (await import('@/pages/landing/LandingWizard')).default;
    useAuth = (await import('@/context/AuthContext')).useAuth;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (useAuth as any).mockReturnValue({ signUp: mockSignUp });
  });

  it('renders step 1 by default', async () => {
    render(React.createElement(LandingWizard));
    expect(screen.getByText('Name your bot')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. ShopBot, SupportAI...')).toBeTruthy();
  });

  it('navigates to step 2 on Continue', async () => {
    render(React.createElement(LandingWizard));
    const input = screen.getByPlaceholderText('e.g. ShopBot, SupportAI...');
    fireEvent.change(input, { target: { value: 'TestBot' } });
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Set the tone')).toBeTruthy();
  });

  it('validates bot name on step 1', async () => {
    render(React.createElement(LandingWizard));
    fireEvent.click(screen.getByText('Continue'));

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Name must be at least 2 characters');
    });
    expect(screen.getByText('Name your bot')).toBeTruthy();
  });

  it('navigates back from step 2 to step 1', async () => {
    render(React.createElement(LandingWizard));
    const input = screen.getByPlaceholderText('e.g. ShopBot, SupportAI...');
    fireEvent.change(input, { target: { value: 'TestBot' } });
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Set the tone')).toBeTruthy();

    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Name your bot')).toBeTruthy();
  });

  it('validates at least one FAQ on step 3', async () => {
    render(React.createElement(LandingWizard));
    const input = screen.getByPlaceholderText('e.g. ShopBot, SupportAI...');
    fireEvent.change(input, { target: { value: 'TestBot' } });
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Add knowledge')).toBeTruthy();

    const questionInputs = screen.getAllByPlaceholderText('Question');
    const answerInputs = screen.getAllByPlaceholderText('Answer');
    questionInputs.forEach(q => fireEvent.change(q, { target: { value: '' } }));
    answerInputs.forEach(a => fireEvent.change(a, { target: { value: '' } }));

    fireEvent.click(screen.getByText('Continue'));

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Add at least one FAQ');
    });
  });

  it('renders preview with LiveChatDemo on step 4', async () => {
    render(React.createElement(LandingWizard));
    const input = screen.getByPlaceholderText('e.g. ShopBot, SupportAI...');
    fireEvent.change(input, { target: { value: 'MyBot' } });
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));

    expect(screen.getByTestId('live-chat-demo')).toBeTruthy();
    expect(screen.getByText(/MyBot/)).toBeTruthy();
  });

  it('renders signup form on step 5 for new users', async () => {
    render(React.createElement(LandingWizard));
    const input = screen.getByPlaceholderText('e.g. ShopBot, SupportAI...');
    fireEvent.change(input, { target: { value: 'TestBot' } });
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));

    expect(screen.getByText('Create your free account')).toBeTruthy();
    expect(screen.getByText('Create Account')).toBeTruthy();
  });

  it('stores wizard data and pending_wizard on signup', async () => {
    mockSignUp.mockResolvedValue({});
    render(React.createElement(LandingWizard));
    const input = screen.getByPlaceholderText('e.g. ShopBot, SupportAI...');
    fireEvent.change(input, { target: { value: 'TestBot' } });
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'test@test.com' } });
    const pwInput = screen.getByPlaceholderText('At least 8 characters');
    fireEvent.change(pwInput, { target: { value: 'password123' } });

    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@test.com', 'password123', 'Test User');
    });
    expect(localStorage.getItem('landing_wizard_data')).toBeTruthy();
    expect(localStorage.getItem('pending_wizard')).toBe('true');
  });

  it('shows check email screen after signup', async () => {
    mockSignUp.mockResolvedValue({});
    render(React.createElement(LandingWizard));
    const input = screen.getByPlaceholderText('e.g. ShopBot, SupportAI...');
    fireEvent.change(input, { target: { value: 'TestBot' } });
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));
    fireEvent.click(screen.getByText('Continue'));

    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('john@example.com'), { target: { value: 'test@test.com' } });
    const pwInput = screen.getByPlaceholderText('At least 8 characters');
    fireEvent.change(pwInput, { target: { value: 'password123' } });

    fireEvent.click(screen.getByText('Create Account'));

    await waitFor(() => {
      expect(screen.getByText(/Check your email/)).toBeTruthy();
    });
    expect(screen.getAllByText(/test@test.com/).length).toBeGreaterThanOrEqual(1);
  });
});

