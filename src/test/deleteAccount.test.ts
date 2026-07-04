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
  serve: (handler: any) => { /* noop */ },
});

vi.stubGlobal('AbortSignal', { timeout: () => new AbortController().signal });

function createBuilder() {
  const thenQueue: Array<{ data: any; error: any }> = [];
  const b = {
    select: vi.fn(() => b),
    insert: vi.fn(() => b),
    update: vi.fn(() => b),
    delete: vi.fn(() => b),
    eq: vi.fn(() => b),
    in: vi.fn(() => b),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve: any) => {
      const r = thenQueue.shift() ?? { data: [], error: null };
      resolve(r);
    }),
    _pushThenResult: (d: any, e: any = null) => { thenQueue.push({ data: d, error: e }); return b; },
  };
  return b;
}

const mockSupabase = vi.hoisted(() => ({ from: vi.fn() }));
const authMock = vi.hoisted(() => ({
  getUser: vi.fn(),
  admin: { deleteUser: vi.fn() },
}));

vi.mock('https://esm.sh/@supabase/supabase-js@2.49.1', () => ({
  createClient: vi.fn(() => ({
    from: mockSupabase.from,
    auth: authMock,
  })),
}));

describe('delete-account', () => {
  let handler: (req: Request) => Promise<Response>;
  const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

  function makeChain() {
    const b = createBuilder();
    mockSupabase.from.mockReturnValue(b);
    return b;
  }

  async function req(authToken?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken !== undefined) headers['Authorization'] = `Bearer ${authToken}`;
    const mod = await import('../../supabase/functions/delete-account/index.ts');
    handler = mod.handler;
    return handler(new Request('https://test.supabase.co/functions/v1/delete-account', {
      method: 'POST', headers, body: JSON.stringify({}),
    }));
  }

  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getUser.mockReset();
    authMock.admin.deleteUser.mockReset();
  });

  it('rejects OPTIONS with 200', async () => {
    const mod = await import('../../supabase/functions/delete-account/index.ts');
    handler = mod.handler;
    const res = await handler(new Request('https://test.supabase.co/functions/v1/delete-account', { method: 'OPTIONS' }));
    expect(res.status).toBe(200);
  });

  it('rejects GET method', async () => {
    const mod = await import('../../supabase/functions/delete-account/index.ts');
    handler = mod.handler;
    const res = await handler(new Request('https://test.supabase.co/functions/v1/delete-account', { method: 'GET' }));
    expect(res.status).toBe(405);
  });

  it('rejects missing Authorization header', async () => {
    const res = await req(undefined);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('rejects invalid token', async () => {
    authMock.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Invalid token') });
    const res = await req('bad-token');
    expect(res.status).toBe(401);
  });

  it('deletes all user data and auth user on success', async () => {
    const b = makeChain();
    authMock.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    authMock.admin.deleteUser.mockResolvedValue({ error: null });

    // Mock chatbots query to return some IDs
    b._pushThenResult([{ id: 'bot-1' }, { id: 'bot-2' }]);
    // Mock follow_up_rules query
    b._pushThenResult([{ id: 'rule-1' }]);

    const res = await req('valid-token');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Verify auth admin.deleteUser was called with correct ID
    expect(authMock.admin.deleteUser).toHaveBeenCalledWith(USER_ID);
  });

  it('handles auth deletion failure gracefully', async () => {
    const b = makeChain();
    authMock.getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
    authMock.admin.deleteUser.mockResolvedValue({ error: new Error('Auth API error') });

    b._pushThenResult([]);

    const res = await req('valid-token');
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('auth deletion failed');
  });
});
