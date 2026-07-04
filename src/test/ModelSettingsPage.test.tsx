import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

const mockUseAuth = vi.fn();
const modelSelectChain = vi.fn();
const chatbotSelectChain = vi.fn();
const chatbotUpdateChain = vi.fn();

vi.mock('lucide-react', () => ({
  ArrowLeft: () => null,
  ChevronDown: () => null,
  Info: () => null,
  X: () => null,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'ai_models') {
        return { select: modelSelectChain };
      }
      if (table === 'chatbots') {
        return { select: chatbotSelectChain, update: chatbotUpdateChain };
      }
      return { select: vi.fn(), update: vi.fn() };
    }),
  },
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

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
}));

const ModelSettingsPage = React.lazy(() => import('@/pages/dashboard/ModelSettingsPage'));

describe('ModelSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
  });

  const mockModels = [
    { id: '1', name: 'google/gemini-2.5-flash', display_name: 'Gemini 2.5 Flash', provider: 'Google', supports_vision: true, is_active: true },
    { id: '2', name: 'openai/gpt-4o', display_name: 'GPT-4o', provider: 'OpenAI', supports_vision: true, is_active: true },
  ];

  const mockChatbot = {
    id: 'chatbot-1',
    name: 'Test Bot',
    ai_model: 'google/gemini-2.5-flash',
    fallback_model: null,
    routing_strategy: 'single',
    user_id: 'user-1',
  };

  const setupMocks = () => {
    modelSelectChain.mockReturnValue({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockModels, error: null })),
      })),
    });

    chatbotSelectChain.mockReturnValue({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: mockChatbot, error: null })),
      })),
    });

    chatbotUpdateChain.mockReturnValue({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    });
  };

  it('renders the page with title', async () => {
    setupMocks();

    render(
      <MemoryRouter initialEntries={['/dashboard/model-settings/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/model-settings/:chatbotId" element={<React.Suspense fallback={null}><ModelSettingsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Model Settings')).toBeTruthy();
    });
  });

  it('shows chatbot name', async () => {
    setupMocks();

    render(
      <MemoryRouter initialEntries={['/dashboard/model-settings/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/model-settings/:chatbotId" element={<React.Suspense fallback={null}><ModelSettingsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Test Bot/)).toBeTruthy();
    });
  });

  it('allows model selection', async () => {
    setupMocks();

    render(
      <MemoryRouter initialEntries={['/dashboard/model-settings/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/model-settings/:chatbotId" element={<React.Suspense fallback={null}><ModelSettingsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const select = screen.getByLabelText('Primary AI Model') as HTMLSelectElement;
      expect(select).toBeTruthy();
      fireEvent.change(select, { target: { value: 'openai/gpt-4o' } });
      expect(select.value).toBe('openai/gpt-4o');
    });
  });

  it('saves settings when clicking Save Changes', async () => {
    setupMocks();

    render(
      <MemoryRouter initialEntries={['/dashboard/model-settings/chatbot-1']}>
        <Routes>
          <Route path="/dashboard/model-settings/:chatbotId" element={<React.Suspense fallback={null}><ModelSettingsPage /></React.Suspense>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Model Settings')).toBeTruthy();
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(chatbotUpdateChain).toHaveBeenCalled();
    });
  });
});
