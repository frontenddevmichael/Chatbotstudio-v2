import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import { Search, ShieldCheck, ShieldOff, Download } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const UserManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);
  const [roleConfirm, setRoleConfirm] = useState<{ id: string; name: string; isAdmin: boolean } | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500);
      return data ?? [];
    },
  });

  const { data: adminRoles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('user_id, role').eq('role', 'admin');
      return new Set((data ?? []).map((r: any) => r.user_id));
    },
  });

  // Chatbot counts per user
  const { data: botCounts } = useQuery({
    queryKey: ['admin-bot-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('chatbots').select('user_id');
      const counts: Record<string, number> = {};
      (data ?? []).forEach((b: any) => { counts[b.user_id] = (counts[b.user_id] ?? 0) + 1; });
      return counts;
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

  const toggleAdmin = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      if (isAdmin) {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', id).eq('role', 'admin');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').insert({ user_id: id, role: 'admin' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      toast.success('Admin role updated');
      setRoleConfirm(null);
    },
    onError: () => {
      toast.error('Failed to update admin role');
      setRoleConfirm(null);
    },
  });

  const exportCSV = () => {
    const rows = filtered.map((u: any) => ({
      Name: u.full_name || 'Unnamed',
      ID: u.id,
      Plan: u.plan || 'free',
      Messages: `${u.monthly_message_count ?? 0}/${u.message_limit ?? 500}`,
      Chatbots: botCounts?.[u.id] ?? 0,
      Admin: adminRoles?.has(u.id) ? 'Yes' : 'No',
      Joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
    }));
    const header = Object.keys(rows[0] || {}).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <AdminLayout>
      <SEO title="User Management" noIndex />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Users</h1>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Bots</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Messages</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => {
                const isUserAdmin = adminRoles?.has(u.id) ?? false;
                return (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="text-foreground font-medium">{u.full_name || 'Unnamed'}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">{u.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      {isUserAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.plan === 'premium' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>{u.plan}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{botCounts?.[u.id] ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.monthly_message_count ?? 0} / {u.message_limit ?? 500}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePlan.mutate({ id: u.id, plan: u.plan })}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {u.plan === 'premium' ? 'Downgrade' : 'Upgrade'}
                        </button>
                        <button
                          onClick={() => setRoleConfirm({ id: u.id, name: u.full_name || 'Unnamed', isAdmin: isUserAdmin })}
                          className={`inline-flex items-center gap-1 text-xs font-medium hover:underline ${
                            isUserAdmin ? 'text-destructive' : 'text-foreground'
                          }`}
                        >
                          {isUserAdmin ? <><ShieldOff className="h-3 w-3" /> Revoke</> : <><ShieldCheck className="h-3 w-3" /> Make Admin</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!roleConfirm} onOpenChange={(open) => !open && setRoleConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {roleConfirm?.isAdmin ? 'Revoke Admin Access' : 'Grant Admin Access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roleConfirm?.isAdmin
                ? `Remove admin privileges from ${roleConfirm.name}? They will lose access to the admin portal.`
                : `Make ${roleConfirm?.name} an admin? They will have full access to the admin portal.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roleConfirm && toggleAdmin.mutate({ id: roleConfirm.id, isAdmin: roleConfirm.isAdmin })}
            >
              {roleConfirm?.isAdmin ? 'Revoke' : 'Grant Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default UserManager;
