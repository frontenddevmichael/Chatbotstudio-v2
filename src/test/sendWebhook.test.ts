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

vi.stubGlobal('AbortSignal', { timeout: () => new AbortController().signal });

vi.mock('https://deno.land/std@0.168.0/http/server.ts', () => ({
  serve: (handler: any) => handler,
}));

const defaultResult = { data: [] as any[], error: null };

function createBuilder() {
  const thenQueue: Array<{ data: any; error: any }> = [];
  const b = {
    select: vi.fn(() => b),
    insert: vi.fn(() => b),
    update: vi.fn(() => b),
    delete: vi.fn(() => b),
    eq: vi.fn(() => b),
    filter: vi.fn(() => b),
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

describe('send-webhook', () => {
  let handler: (req: Request) => Promise<Response>;
  const SERVICE_KEY = 'test-service-role-key';
  const CHATBOT_ID = '550e8400-e29b-41d4-a716-446655440000';

  function makeChain() {
    const b = createBuilder();
    mockSupabase.from.mockReturnValue(b);
    return b;
  }

  async function req(body: any, authToken?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken !== undefined) headers['Authorization'] = `Bearer ${authToken}`;
    return handler(new Request('https://test.supabase.co/functions/v1/send-webhook', {
      method: 'POST', headers, body: JSON.stringify(body),
    }));
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    const mod = await import('../../supabase/functions/send-webhook/index.ts');
    handler = mod.handler;
  });

  it('rejects requests without Authorization header', async () => {
    const res = await req({ chatbot_id: CHATBOT_ID, event: 'message.created' }, undefined);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('unauthorized');
  });

  it('rejects requests with wrong token', async () => {
    const res = await req({ chatbot_id: CHATBOT_ID, event: 'message.created' }, 'wrong-key');
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('unauthorized');
  });

  it('rejects missing chatbot_id', async () => {
    const res = await req({ event: 'message.created' }, SERVICE_KEY);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('chatbot_id_and_event_required');
  });

  it('rejects missing event', async () => {
    const res = await req({ chatbot_id: CHATBOT_ID }, SERVICE_KEY);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('chatbot_id_and_event_required');
  });

  it('delivers webhook to active endpoints', async () => {
    const b = makeChain();
    b._pushThenResult([
      { id: 'wh-1', url: 'https://example.com/webhook', secret: 'sec', events: ['message.created'] },
    ]);
    b._pushThenResult(null);
    const res = await req({ chatbot_id: CHATBOT_ID, event: 'message.created', data: { hello: 'world' } }, SERVICE_KEY);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.delivered).toBe(1);
  });

  it('returns delivered: 0 when no endpoints match', async () => {
    const b = makeChain();
    b._pushThenResult([]);
    const res = await req({ chatbot_id: CHATBOT_ID, event: 'message.created' }, SERVICE_KEY);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.delivered).toBe(0);
  });
});
