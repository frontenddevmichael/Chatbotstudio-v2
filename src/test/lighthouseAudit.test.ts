import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEnv: Record<string, string> = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  LIGHTHOUSE_PAGESPEED_API_KEY: '',
};

vi.stubGlobal('Deno', {
  env: {
    get: (key: string) => mockEnv[key],
    set: (key: string, value: string) => { mockEnv[key] = value; },
  },
  serve: (handler: any) => { /* noop */ },
});

vi.stubGlobal('AbortSignal', { timeout: () => new AbortController().signal });

function createBuilder() {
  const thenQueue: Array<{ data: any; error: any }> = [];
  function dequeue() { return thenQueue.shift() ?? { data: [], error: null }; }
  const b = {
    select: vi.fn(() => b),
    insert: vi.fn(() => b),
    update: vi.fn(() => b),
    delete: vi.fn(() => b),
    eq: vi.fn(() => b),
    in: vi.fn(() => b),
    single: vi.fn(() => Promise.resolve(dequeue())),
    order: vi.fn(() => b),
    limit: vi.fn(() => b),
    maybeSingle: vi.fn(() => Promise.resolve(dequeue())),
    then: vi.fn((resolve: any) => { resolve(dequeue()); }),
    _pushThenResult: (d: any, e: any = null) => { thenQueue.push({ data: d, error: e }); return b; },
  };
  return b;
}

const mockSupabase = vi.hoisted(() => ({ from: vi.fn() }));
const authMock = vi.hoisted(() => ({ getUser: vi.fn() }));

vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: vi.fn(() => ({
    from: mockSupabase.from,
    auth: authMock,
  })),
}));

describe('lighthouse-audit', () => {
  let handler: (req: Request) => Promise<Response>;
  const CHATBOT_ID = '550e8400-e29b-41d4-a716-446655440000';
  const USER_ID = '660e8400-e29b-41d4-a716-446655440001';

  function makeChain() {
    const b = createBuilder();
    mockSupabase.from.mockReturnValue(b);
    return b;
  }

  async function req(body: any, authToken?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken !== undefined) headers['Authorization'] = `Bearer ${authToken}`;
    const mod = await import('../../supabase/functions/lighthouse-audit/index.ts');
    handler = mod.handler;
    return handler(new Request('https://test.supabase.co/functions/v1/lighthouse-audit', {
      method: 'POST', headers, body: JSON.stringify(body),
    }));
  }

  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getUser.mockReset();
    mockEnv.LIGHTHOUSE_PAGESPEED_API_KEY = '';
  });

  it('rejects missing Authorization header', async () => {
    const res = await req({ chatbot_id: CHATBOT_ID, url: 'https://example.com' });
    expect(res.status).toBe(401);
  });

  it('rejects invalid auth token', async () => {
    authMock.getUser.mockResolvedValue({ data: { user: null }, error: new Error('bad token') });
    const res = await req({ chatbot_id: CHATBOT_ID, url: 'https://example.com' }, 'bad');
    expect(res.status).toBe(401);
  });

  it('rejects missing chatbot_id', async () => {
    authMock.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    const res = await req({ url: 'https://example.com' }, 'valid');
    expect(res.status).toBe(400);
  });

  it('rejects missing url', async () => {
    authMock.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    const res = await req({ chatbot_id: CHATBOT_ID }, 'valid');
    expect(res.status).toBe(400);
  });

  it('returns 501 when API key is not configured', async () => {
    authMock.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    const b = makeChain();
    b._pushThenResult({ id: CHATBOT_ID, user_id: USER_ID });
    const res = await req({ chatbot_id: CHATBOT_ID, url: 'https://example.com' }, 'valid');
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.error).toBe('lighthouse_not_configured');
  });

  it('returns 403 when chatbot does not belong to user', async () => {
    authMock.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    const b = makeChain();
    b._pushThenResult({ id: CHATBOT_ID, user_id: 'other-user-id' });
    const res = await req({ chatbot_id: CHATBOT_ID, url: 'https://example.com' }, 'valid');
    expect(res.status).toBe(403);
  });

  it('calls PageSpeed API and stores scores when configured', async () => {
    mockEnv.LIGHTHOUSE_PAGESPEED_API_KEY = 'test-api-key';
    authMock.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });

    const b = makeChain();
    b._pushThenResult({ id: CHATBOT_ID, user_id: USER_ID });

    const mockPsiResponse = {
      lighthouseResult: {
        categories: {
          performance: { score: 0.85 },
          accessibility: { score: 0.92 },
          'best-practices': { score: 0.78 },
          seo: { score: 0.95 },
        },
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPsiResponse),
    });
    vi.stubGlobal('fetch', mockFetch);

    // Mock insert result
    const insertResult = {
      id: 'score-1',
      chatbot_id: CHATBOT_ID,
      url: 'https://example.com',
      performance: 85,
      accessibility: 92,
      best_practices: 78,
      seo: 95,
      pwa: null,
      score_json: mockPsiResponse,
    };
    b._pushThenResult(insertResult);

    const res = await req({ chatbot_id: CHATBOT_ID, url: 'https://example.com' }, 'valid');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.performance).toBe(85);
    expect(body.accessibility).toBe(92);
    expect(body.best_practices).toBe(78);
    expect(body.seo).toBe(95);
    expect(body.pwa).toBeNull();
  });
});
