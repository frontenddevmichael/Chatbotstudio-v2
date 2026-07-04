import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubGlobal('Deno', {
  env: {
    get: (key: string) => {
      const envs: Record<string, string> = {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      };
      return envs[key];
    },
  },
});

vi.mock('https://deno.land/std@0.168.0/http/server.ts', () => ({
  serve: (handler: any) => handler,
}));

const defaultResult = { data: null, error: null };

function createBuilder() {
  const thenQueue: Array<{ data: any; error: any }> = [];
  const b = {
    select: vi.fn(() => b),
    insert: vi.fn(() => b),
    update: vi.fn(() => b),
    delete: vi.fn(() => b),
    eq: vi.fn(() => b),
    order: vi.fn(() => b),
    limit: vi.fn(() => b),
    single: vi.fn(() => Promise.resolve(defaultResult)),
    then: vi.fn((resolve: any) => {
      const r = thenQueue.shift() ?? defaultResult;
      resolve(r);
    }),
    _pushThenResult: (d: any, e: any = null) => { thenQueue.push({ data: d, error: e }); return b; },
  };
  return b;
}

const mockSupabase = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: vi.fn(() => ({ from: mockSupabase.from })),
}));

describe('REST API logic', () => {
  let handler: (req: Request) => Promise<Response>;
  const VALID_KEY = 'valid-api-key-123';
  const USER_ID = 'user-1';
  const CHATBOT_ID = 'chatbot-1';

  function makeChain() {
    const b = createBuilder();
    mockSupabase.from.mockReturnValue(b);
    return b;
  }

  function setupKeyOk(b: ReturnType<typeof createBuilder>) {
    b.single.mockResolvedValueOnce({
      data: { id: 'key-1', user_id: USER_ID, key: VALID_KEY, is_active: true, last_used_at: null },
      error: null,
    });
  }

  function setupKeyAndBotOk(b: ReturnType<typeof createBuilder>) {
    setupKeyOk(b);
    b.single.mockResolvedValueOnce({
      data: { id: CHATBOT_ID, user_id: USER_ID }, error: null,
    });
  }

  async function req(method: string, path: string, body?: any, apiKey = VALID_KEY) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    return handler(new Request(`https://test.supabase.co${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
    }));
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../../supabase/functions/rest-api/index.ts');
    handler = mod.default;
  });

  describe('API key validation', () => {
    it('rejects without authorization header', async () => {
      const res = await req('GET', '/chatbots', undefined, '');
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe('missing_authorization_header');
    });

    it('rejects invalid API key', async () => {
      const b = makeChain();
      b.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
      const res = await req('GET', '/chatbots', undefined, 'bad');
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe('invalid_api_key');
    });

    it('rejects inactive API key', async () => {
      const b = makeChain();
      b.single.mockResolvedValueOnce({
        data: { id: 'key-1', user_id: USER_ID, key: VALID_KEY, is_active: false },
        error: null,
      });
      const res = await req('GET', '/chatbots');
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe('api_key_inactive');
    });

    it('accepts valid API key', async () => {
      const b = makeChain();
      setupKeyOk(b);
      b._pushThenResult(null); // fire-and-forget update last_used_at
      b._pushThenResult([]);   // query results
      const res = await req('GET', '/chatbots');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /chatbots', () => {
    it('lists chatbots', async () => {
      const b = makeChain();
      setupKeyOk(b);
      b._pushThenResult(null); // fire-and-forget
      b._pushThenResult([{ id: CHATBOT_ID, name: 'Bot 1', user_id: USER_ID }]);
      const res = await req('GET', '/chatbots');
      expect(res.status).toBe(200);
      expect((await res.json()).data).toHaveLength(1);
    });

    it('returns empty array', async () => {
      const b = makeChain();
      setupKeyOk(b);
      b._pushThenResult(null); // fire-and-forget
      b._pushThenResult([]);
      const res = await req('GET', '/chatbots');
      expect(res.status).toBe(200);
      expect((await res.json()).data).toEqual([]);
    });
  });

  describe('GET /chatbots/:id', () => {
    it('returns a single chatbot', async () => {
      const b = makeChain();
      setupKeyOk(b);
      b._pushThenResult(null); // fire-and-forget
      b.single.mockResolvedValueOnce({
        data: { id: CHATBOT_ID, name: 'Test Bot', user_id: USER_ID }, error: null,
      });
      const res = await req('GET', `/chatbots/${CHATBOT_ID}`);
      expect(res.status).toBe(200);
      expect((await res.json()).data.id).toBe(CHATBOT_ID);
    });

    it('returns 404 for nonexistent chatbot', async () => {
      const b = makeChain();
      setupKeyOk(b);
      b._pushThenResult(null); // fire-and-forget
      b.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
      const res = await req('GET', '/chatbots/nonexistent');
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe('chatbot_not_found');
    });

    it('returns 403 for chatbot owned by another user', async () => {
      const b = makeChain();
      setupKeyOk(b);
      b._pushThenResult(null); // fire-and-forget
      b.single.mockResolvedValueOnce({
        data: { id: CHATBOT_ID, name: 'Other Bot', user_id: 'other' }, error: null,
      });
      const res = await req('GET', `/chatbots/${CHATBOT_ID}`);
      expect(res.status).toBe(403);
      expect((await res.json()).error).toBe('forbidden');
    });
  });

  describe('POST /chatbots/:id/chat', () => {
    it('sends a message', async () => {
      const b = makeChain();
      setupKeyAndBotOk(b);
      b._pushThenResult(null); // fire-and-forget
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true, status: 200,
        json: () => Promise.resolve({ response: 'Hello from AI', session_id: 'sess-1' }),
      }));
      const res = await req('POST', `/chatbots/${CHATBOT_ID}/chat`, {
        message: 'Hello', session_id: 'sess-1',
      });
      expect(res.status).toBe(200);
      expect((await res.json()).response).toBe('Hello from AI');
    });

    it('returns 400 for missing message', async () => {
      const b = makeChain();
      setupKeyAndBotOk(b);
      b._pushThenResult(null); // fire-and-forget
      const res = await req('POST', `/chatbots/${CHATBOT_ID}/chat`, {});
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('invalid_message');
    });

    it('returns 404 for nonexistent chatbot', async () => {
      const b = makeChain();
      setupKeyOk(b);
      b._pushThenResult(null); // fire-and-forget
      b.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
      const res = await req('POST', `/chatbots/${CHATBOT_ID}/chat`, { message: 'Hello' });
      expect(res.status).toBe(404);
      expect((await res.json()).error).toBe('chatbot_not_found');
    });
  });

  describe('GET /chatbots/:id/faqs', () => {
    it('lists FAQs', async () => {
      const b = makeChain();
      setupKeyOk(b);
      b._pushThenResult(null); // fire-and-forget
      b._pushThenResult([{ id: 'faq-1', question: 'What?', answer: 'Test' }]);
      const res = await req('GET', `/chatbots/${CHATBOT_ID}/faqs`);
      expect(res.status).toBe(200);
      expect((await res.json()).data).toHaveLength(1);
    });
  });

  describe('POST /chatbots/:id/faqs', () => {
    it('creates a FAQ', async () => {
      const b = makeChain();
      setupKeyAndBotOk(b);
      b._pushThenResult(null); // fire-and-forget
      b.single.mockResolvedValueOnce({
        data: { id: 'faq-new', chatbot_id: CHATBOT_ID, question: 'Q?', answer: 'A!', variations: [] },
        error: null,
      });
      const res = await req('POST', `/chatbots/${CHATBOT_ID}/faqs`, { question: 'Q?', answer: 'A!' });
      expect(res.status).toBe(201);
      expect((await res.json()).data.question).toBe('Q?');
    });

    it('returns 400 for invalid body', async () => {
      const b = makeChain();
      setupKeyAndBotOk(b);
      b._pushThenResult(null); // fire-and-forget
      const res = await req('POST', `/chatbots/${CHATBOT_ID}/faqs`, {});
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('invalid_body');
    });
  });

  describe('GET /chatbots/:id/conversations', () => {
    it('lists conversations', async () => {
      const b = makeChain();
      setupKeyAndBotOk(b);
      b._pushThenResult(null); // fire-and-forget
      b._pushThenResult([{ id: 'conv-1', chatbot_id: CHATBOT_ID, messages: [] }]);
      const res = await req('GET', `/chatbots/${CHATBOT_ID}/conversations`);
      expect(res.status).toBe(200);
      expect((await res.json()).data).toHaveLength(1);
    });
  });

  describe('GET /chatbots/:id/analytics', () => {
    it('returns analytics', async () => {
      const b = makeChain();
      setupKeyAndBotOk(b);
      b._pushThenResult(null); // fire-and-forget
      b._pushThenResult([
        { messages: [{ role: 'user' }, { role: 'assistant' }] },
        { messages: [{ role: 'user' }] },
      ]);
      const res = await req('GET', `/chatbots/${CHATBOT_ID}/analytics`);
      const data = await res.json();
      expect(data.data.total_conversations).toBe(2);
      expect(data.data.total_messages).toBe(3);
    });

    it('returns zero analytics', async () => {
      const b = makeChain();
      setupKeyAndBotOk(b);
      b._pushThenResult(null); // fire-and-forget
      b._pushThenResult([]);
      const res = await req('GET', `/chatbots/${CHATBOT_ID}/analytics`);
      const data = await res.json();
      expect(data.data.total_conversations).toBe(0);
      expect(data.data.total_messages).toBe(0);
    });
  });

  describe('404 handling', () => {
    it('returns 404 for unknown routes', async () => {
      const b = makeChain();
      setupKeyOk(b);
      b._pushThenResult(null);
      const res = await req('GET', '/unknown');
      expect(res.status).toBe(404);
    });

    it('returns 405 for unsupported methods', async () => {
      const b = makeChain();
      setupKeyOk(b);
      b._pushThenResult(null);
      const res = await req('PUT', '/chatbots');
      expect(res.status).toBe(405);
    });

    it('handles OPTIONS', async () => {
      const b = makeChain();
      setupKeyOk(b);
      const res = await handler(new Request('https://test.supabase.co/chatbots', {
        method: 'OPTIONS', headers: { Authorization: `Bearer ${VALID_KEY}` },
      }));
      expect(res.status).toBe(200);
    });
  });
});
