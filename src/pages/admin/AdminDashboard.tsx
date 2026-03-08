import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { Users, Bot, MessageSquare, AlertTriangle, Crown, Mail } from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [{ count: userCount }, { count: botCount }, { count: convoCount }, { count: waitlistCount }, { data: settings }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('chatbots').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('waitlist').select('*', { count: 'exact', head: true }),
        supabase.from('platform_settings').select('*').single(),
      ]);
      // Count premium users
      const { count: premiumCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'premium');
      return { userCount: userCount ?? 0, botCount: botCount ?? 0, convoCount: convoCount ?? 0, waitlistCount: waitlistCount ?? 0, premiumCount: premiumCount ?? 0, settings };
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const { data: activeBots } = useQuery({
    queryKey: ['admin-active-bots'],
    queryFn: async () => {
      const { data } = await supabase.from('chatbots').select('*').order('total_conversations', { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  return (
    <AdminLayout>
      <SEO title="Admin Dashboard" noIndex />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>

      {stats?.settings?.maintenance_mode && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="h-4 w-4" /> Maintenance mode is active
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <Users className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Total Users</p>
          <p className="font-display text-2xl font-bold text-foreground">{stats?.userCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Bot className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Total Chatbots</p>
          <p className="font-display text-2xl font-bold text-foreground">{stats?.botCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <MessageSquare className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Conversations</p>
          <p className="font-display text-2xl font-bold text-foreground">{stats?.convoCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Mail className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Waitlist</p>
          <p className="font-display text-2xl font-bold text-foreground">{stats?.waitlistCount ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Crown className="mb-2 h-5 w-5 text-primary" />
          <p className="text-xs text-muted-foreground">Premium Users</p>
          <p className="font-display text-2xl font-bold text-foreground">{stats?.premiumCount ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Signups</h3>
          {recentUsers?.length ? (
            <div className="space-y-2">
              {recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between rounded-md bg-muted p-2.5 text-sm">
                  <span className="text-foreground">{u.full_name || 'Unnamed'}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">{u.plan}</span>
                    <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No users yet</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Most Active Chatbots</h3>
          {activeBots?.length ? (
            <div className="space-y-2">
              {activeBots.map((bot: any) => (
                <div key={bot.id} className="flex items-center justify-between rounded-md bg-muted p-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span>{bot.avatar_emoji}</span>
                    <span className="text-foreground">{bot.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{bot.total_conversations ?? 0} convos</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No chatbots yet</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
