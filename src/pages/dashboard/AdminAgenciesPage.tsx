import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import PageLoader from '@/components/ui/PageLoader';
import SEO from '@/components/ui/SEO';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface AgencyWithCount {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  custom_domain: string | null;
  brand_color: string;
  created_at: string | null;
  owner_id: string;
  member_count: number;
}

const AdminAgenciesPage = () => {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: agencies, isLoading } = useQuery({
    queryKey: ['admin-agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = data as AgencyWithCount[];
      const enriched = await Promise.all(
        rows.map(async (a) => {
          const { count } = await supabase
            .from('agency_members')
            .select('*', { count: 'exact', head: true })
            .eq('agency_id', a.id);
          return { ...a, member_count: count || 0 };
        })
      );
      return enriched;
    },
    enabled: isAdmin,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('agencies')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-agencies'] });
      toast.success('Agency status toggled');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to toggle agency status'),
  });

  const filtered = useMemo(() => {
    if (!agencies) return [];
    if (!debouncedSearch) return agencies;
    const q = debouncedSearch.toLowerCase();
    return agencies.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.custom_domain || '').toLowerCase().includes(q)
    );
  }, [agencies, debouncedSearch]);

  if (loading) return <PageLoader />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <AdminLayout>
      <SEO title="Admin – Agencies" noIndex />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-foreground">Agencies</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Manage all white-label agencies.</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agencies..."
          className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-card" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Agency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Members</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Domain</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full" style={{ background: a.brand_color }} />
                      <span className="text-foreground font-medium">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{a.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px]">{a.member_count}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.custom_domain || '—'}</td>
                  <td className="px-4 py-3">
                    {a.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive.mutate({ id: a.id, is_active: a.is_active })}
                      disabled={toggleActive.isPending}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {a.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-[14px] font-medium text-foreground">No agencies found</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Agencies will appear here once created.</p>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAgenciesPage;
