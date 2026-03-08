import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { Users, Bot, MessageSquare, AlertTriangle, Crown, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statConfig = [
  { key: 'userCount', icon: Users, label: 'Total Users', color: 'bg-primary/10 text-primary' },
  { key: 'botCount', icon: Bot, label: 'Total Chatbots', color: 'bg-success/10 text-success' },
  { key: 'convoCount', icon: MessageSquare, label: 'Conversations', color: 'bg-accent/10 text-accent' },
  { key: 'waitlistCount', icon: Mail, label: 'Waitlist', color: 'bg-warning/10 text-warning' },
  { key: 'premiumCount', icon: Crown, label: 'Premium Users', color: 'bg-secondary/10 text-secondary' },
];

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

  const maxConvos = activeBots?.length ? Math.max(...activeBots.map((b: any) => b.total_conversations ?? 0), 1) : 1;

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
        {statConfig.map(({ key, icon: Icon, label, color }) => (
          <div key={key} className="glass-card glow-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color.split(' ')[0]}`}>
                <Icon className={`h-4 w-4 ${color.split(' ')[1]}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-display text-2xl font-bold text-foreground">{(stats as any)?.[key] ?? 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-lg p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Signups</h3>
          {recentUsers?.length ? (
            <div className="space-y-2">
              {recentUsers.map((u: any) => {
                const initial = (u.full_name || 'U')[0].toUpperCase();
                return (
                  <div key={u.id} className="flex items-center gap-3 rounded-md bg-muted/50 p-2.5 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {initial}
                    </div>
                    <span className="flex-1 truncate text-foreground">{u.full_name || 'Unnamed'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      u.plan === 'premium' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                    }`}>
                      {u.plan || 'free'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {u.created_at ? formatDistanceToNow(new Date(u.created_at), { addSuffix: true }) : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No users yet</p>
          )}
        </div>

        <div className="glass-card rounded-lg p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Most Active Chatbots</h3>
          {activeBots?.length ? (
            <div className="space-y-2">
              {activeBots.map((bot: any) => (
                <div key={bot.id} className="flex items-center gap-3 rounded-md bg-muted/50 p-2.5 text-sm">
                  <span
                    className={`relative inline-block h-2 w-2 rounded-full ${
                      bot.is_active ? 'bg-success pulse-dot' : 'bg-muted-foreground'
                    }`}
                  />
                  <span className="text-lg">{bot.avatar_emoji}</span>
                  <span className="flex-1 truncate text-foreground">{bot.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${((bot.total_conversations ?? 0) / maxConvos) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{bot.total_conversations ?? 0}</span>
                  </div>
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
