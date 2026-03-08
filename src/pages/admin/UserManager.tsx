import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';

const UserManager = () => {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

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
  });

  return (
    <AdminLayout>
      <SEO title="User Management" noIndex />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Users</h1>

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
              {users?.map((u: any) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{u.full_name || 'Unnamed'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.plan === 'premium' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>{u.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.monthly_message_count} / {u.message_limit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePlan.mutate({ id: u.id, plan: u.plan })}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Toggle Plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManager;
