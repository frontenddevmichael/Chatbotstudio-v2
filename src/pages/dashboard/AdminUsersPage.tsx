import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { adminFetch } from '@/lib/adminApi';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import PageLoader from '@/components/ui/PageLoader';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string | null;
  email_confirmed: boolean | null;
  created_at: string | null;
}

const AdminUsersPage = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: users, isLoading } = useQuery({
    queryKey: ['dashboard-admin-users'],
    queryFn: () => adminFetch<UserRow[]>('get-users'),
    enabled: isAdmin,
  });

  const { data: botCounts } = useQuery({
    queryKey: ['dashboard-admin-bot-counts'],
    queryFn: () => adminFetch<Record<string, number>>('get-bot-counts'),
    enabled: isAdmin,
  });

  const confirmEmail = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-confirm-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Confirm email failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-admin-users'] });
      toast.success('Email confirmed');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to confirm email'),
  });

  const filtered = useMemo(() => {
    let result = users ?? [];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.full_name?.toLowerCase().includes(q) ||
          u.id?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [users, debouncedSearch]);

  if (loading) return <PageLoader />;

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <PageWrapper>
      <SEO title="Admin – Users" noIndex />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground">User Email Verification</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Manually confirm user email addresses.
          </p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name..."
          className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email Verified</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Chatbots</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const verified = u.email_confirmed === true;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-foreground font-medium">{u.email || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {verified ? (
                        <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          u.plan === 'premium'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {u.plan || 'free'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {botCounts?.[u.id] ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {!verified && (
                        <button
                          onClick={() => confirmEmail.mutate(u.id)}
                          disabled={confirmEmail.isPending}
                          aria-label="Confirm user email"
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          Confirm Email
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
};

export default AdminUsersPage;
