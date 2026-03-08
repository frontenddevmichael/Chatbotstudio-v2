import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const UserManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let result = users ?? [];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((u: any) => u.full_name?.toLowerCase().includes(q) || u.id?.includes(q));
    }
    if (planFilter !== 'all') {
      result = result.filter((u: any) => u.plan === planFilter);
    }
    return result;
  }, [users, debouncedSearch, planFilter]);

  const togglePlan = useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: string }) => {
      const newPlan = plan === 'premium' ? 'free' : 'premium';
      const newLimit = newPlan === 'premium' ? 10000 : 500;
      const { error } = await supabase.from('profiles').update({ plan: newPlan, message_limit: newLimit }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Plan updated');
    },
    onError: () => toast.error('Failed to update plan'),
  });

  return (
    <AdminLayout>
      <SEO title="User Management" noIndex />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Users</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-card" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Messages</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{u.full_name || 'Unnamed'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.plan === 'premium' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>{u.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.monthly_message_count ?? 0} / {u.message_limit ?? 500}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePlan.mutate({ id: u.id, plan: u.plan })}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {u.plan === 'premium' ? 'Downgrade' : 'Upgrade'}
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManager;
