const ADMIN_SECRET = 'Studio@Admin2026!';

export async function adminFetch<T = unknown>(action: string, payload?: Record<string, unknown>): Promise<T> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/admin-data`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Admin API error');
  }

  return res.json() as Promise<T>;
}
