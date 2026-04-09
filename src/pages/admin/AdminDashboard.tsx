import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/adminApi';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { Users, Bot, MessageSquare, Mail, Crown, HelpCircle, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, subDays, format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

const statConfig = [
  { key: 'userCount', icon: Users, label: 'Total Users', color: 'bg-primary/10 text-primary' },
  { key: 'botCount', icon: Bot, label: 'Chatbots', color: 'bg-success/10 text-success' },
  { key: 'convoCount', icon: MessageSquare, label: 'Conversations', color: 'bg-accent/10 text-accent' },
  { key: 'faqCount', icon: HelpCircle, label: 'FAQs', color: 'bg-warning/10 text-warning' },
  { key: 'premiumCount', icon: Crown, label: 'Premium', color: 'bg-secondary/10 text-secondary' },
  { key: 'waitlistCount', icon: Mail, label: 'Waitlist', color: 'bg-muted text-muted-foreground' },
];

const AdminDashboard = () => {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminFetch('get-stats'),
  });

  const { data: signupChart } = useQuery({
    queryKey: ['admin-signup-chart'],
    queryFn: async () => {
      const since = subDays(new Date(), 30).toISOString();
      const data = await adminFetch('get-signup-chart', { since });
      const buckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        buckets[format(subDays(new Date(), i), 'MMM dd')] = 0;
      }
      (data ?? []).forEach((p: any) => {
        const key = format(new Date(p.created_at), 'MMM dd');
        if (key in buckets) buckets[key]++;
      });
      return Object.entries(buckets).map(([date, count]) => ({ date, count }));
    },
  });

  const { data: convoChart } = useQuery({
    queryKey: ['admin-convo-chart'],
    queryFn: async () => {
      const since = subDays(new Date(), 7).toISOString();
      const data = await adminFetch('get-convo-chart', { since });
      const buckets: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        buckets[format(subDays(new Date(), i), 'EEE')] = 0;
      }
      (data ?? []).forEach((c: any) => {
        const key = format(new Date(c.started_at), 'EEE');
        if (key in buckets) buckets[key]++;
      });
      return Object.entries(buckets).map(([day, count]) => ({ day, count }));
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: () => adminFetch('get-recent-users'),
  });

  const { data: activeBots } = useQuery({
    queryKey: ['admin-active-bots'],
    queryFn: () => adminFetch('get-active-bots'),
  });

  const toggleMaintenance = useMutation({
    mutationFn: () => adminFetch('toggle-maintenance'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Maintenance mode toggled');
    },
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    queryClient.invalidateQueries({ queryKey: ['admin-signup-chart'] });
    queryClient.invalidateQueries({ queryKey: ['admin-convo-chart'] });
    queryClient.invalidateQueries({ queryKey: ['admin-recent-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-active-bots'] });
    toast.success('Data refreshed');
  };

  const maxConvos = activeBots?.length ? Math.max(...activeBots.map((b: any) => b.total_conversations ?? 0), 1) : 1;

  return (
    <AdminLayout>
      <SEO title="Admin Dashboard" noIndex />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <button onClick={refreshAll} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
          <Activity className="h-4 w-4 text-success" />
          <span className="text-sm text-foreground">System: <strong className="text-success">Online</strong></span>
        </div>
        <button
          onClick={() => toggleMaintenance.mutate()}
          className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            stats?.settings?.maintenance_mode
              ? 'border-warning bg-warning/10 text-warning'
              : 'border-border bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Maintenance: {stats?.settings?.maintenance_mode ? 'ON' : 'OFF'}
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground">Est. MRR: <strong>${stats?.revenue?.toFixed(2) ?? '0.00'}</strong></span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground">Avg Bots/User: <strong>{stats?.userCount ? (stats.botCount / stats.userCount).toFixed(1) : '0'}</strong></span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {statConfig.map(({ key, icon: Icon, label, color }) => (
          <div key={key} className="rounded-lg border border-border bg-card p-4">
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

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Signup Growth (30d)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Conversations (7d)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={convoChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
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
                    }`}>{u.plan || 'free'}</span>
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

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Most Active Chatbots</h3>
          {activeBots?.length ? (
            <div className="space-y-2">
              {activeBots.map((bot: any) => (
                <div key={bot.id} className="flex items-center gap-3 rounded-md bg-muted/50 p-2.5 text-sm">
                  <span className={`relative inline-block h-2 w-2 rounded-full ${bot.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                  <span className="text-lg">{bot.avatar_emoji}</span>
                  <span className="flex-1 truncate text-foreground">{bot.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${((bot.total_conversations ?? 0) / maxConvos) * 100}%` }} />
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
