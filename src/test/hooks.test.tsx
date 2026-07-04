import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockIn = vi.fn();

const mockSupabase = {
  from: mockFrom,
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
  initialAuthHash: '',
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
    loading: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnThis();
  mockSelect.mockReturnThis();
  mockEq.mockReturnThis();
  mockOrder.mockReturnThis();
  mockLimit.mockReturnThis();
  mockSingle.mockReturnThis();
  mockInsert.mockReturnThis();
  mockUpdate.mockReturnThis();
  mockDelete.mockReturnThis();
  mockIn.mockReturnThis();
});

describe('useChatbots', () => {
  it('fetches chatbots for the current user', async () => {
    const fakeChatbots = [
      { id: 'bot-1', name: 'Test Bot', user_id: 'user-1' },
    ];
    mockFrom.mockReturnValue({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn(() => ({ data: fakeChatbots, error: null })) })) })) })) });

    const { useFAQs, useCreateFAQ, useUpdateFAQ, useDeleteFAQ, useSupercharge } = await import('@/hooks/useFAQs');

    expect(useFAQs).toBeDefined();
    expect(useCreateFAQ).toBeDefined();
    expect(useUpdateFAQ).toBeDefined();
    expect(useDeleteFAQ).toBeDefined();
    expect(useSupercharge).toBeDefined();
  });
});

describe('useFAQs', () => {
  it('fetches FAQs for a chatbot', async () => {
    const fakeFAQs = [
      { id: 'faq-1', chatbot_id: 'bot-1', question: 'Test?', answer: 'Answer' },
    ];
    mockFrom.mockReturnValue({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn(() => ({ data: fakeFAQs, error: null })) })) })) })) });

    const { useFAQs } = await import('@/hooks/useFAQs');
    const { result } = renderHook(() => useFAQs('bot-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(fakeFAQs);
    expect(mockFrom).toHaveBeenCalledWith('faqs');
  });

  it('returns empty array on error', async () => {
    mockFrom.mockReturnValue({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn(() => ({ data: null, error: new Error('DB error') })) })) })) })) });

    const { useFAQs } = await import('@/hooks/useFAQs');
    const { result } = renderHook(() => useFAQs('bot-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateFAQ', () => {
  it('creates an FAQ', async () => {
    const newFAQ = { id: 'faq-new', chatbot_id: 'bot-1', question: 'Q?', answer: 'A!' };
    mockFrom.mockReturnValue({ insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: newFAQ, error: null })) })) })) });

    const { useCreateFAQ } = await import('@/hooks/useFAQs');
    const { result } = renderHook(() => useCreateFAQ(), { wrapper: createWrapper() });

    result.current.mutate({ chatbot_id: 'bot-1', question: 'Q?', answer: 'A!' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(newFAQ);
  });
});

describe('useDeleteFAQ', () => {
  it('deletes an FAQ', async () => {
    mockFrom.mockReturnValue({ delete: vi.fn(() => ({ eq: vi.fn(() => ({ data: null, error: null })) })) });

    const { useDeleteFAQ } = await import('@/hooks/useFAQs');
    const { result } = renderHook(() => useDeleteFAQ(), { wrapper: createWrapper() });

    result.current.mutate({ id: 'faq-1', chatbot_id: 'bot-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('faqs');
  });
});

describe('useConversations', () => {
  it('fetches conversations for a chatbot', async () => {
    const fakeConvos = [
      { id: 'conv-1', chatbot_id: 'bot-1', messages: [{ role: 'user', content: 'hi' }] },
    ];
    mockFrom.mockReturnValue({ select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ limit: vi.fn(() => ({ data: fakeConvos, error: null })) })) })) })) });

    const { useConversations } = await import('@/hooks/useConversations');
    const { result } = renderHook(() => useConversations('bot-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(fakeConvos);
    expect(mockFrom).toHaveBeenCalledWith('conversations');
  });
});
