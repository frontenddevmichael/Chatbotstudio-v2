import { useAuth } from '@/context/AuthContext';
import { useChatbots, useDeleteChatbot } from '@/hooks/useChatbot';
import { useAllConversationStats } from '@/hooks/useConversations';
import { canCreateChatbot, isPremium, isNearMessageLimit } from '@/lib/plans';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import ChatbotCard from '@/components/chatbot/ChatbotCard';
import AdSidebar from '@/components/ads/AdSidebar';
import UpgradeModal from '@/components/billing/UpgradeModal';
import { Progress } from '@/components/ui/progress';
import { Bot, MessageSquare, BarChart3, Zap, Plus, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

const AnimatedNumber = ({ value }: { value: number }) => {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const controls = animate(motionVal, value, { duration: 0.8, ease: 'easeOut' });
      return controls.stop;
    } else {
      motionVal.set(value);
    }
  }, [value]);

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return unsub;
  }, [rounded]);

  return <>{display}</>;
};

const statColors = [
  { bg: 'bg-primary/10', text: 'text-primary' },
  { bg: 'bg-success/10', text: 'text-success' },
  { bg: 'bg-warning/10', text: 'text-warning' },
  { bg: 'bg-secondary/10', text: 'text-secondary' },
];

const StatCard = ({ icon: Icon, label, value, colorIdx }: { icon: any; label: string; value: number; colorIdx: number }) => {
  const c = statColors[colorIdx % statColors.length];
  return (
    <div className="glass-card glow-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-bold text-foreground">
            <AnimatedNumber value={value} />
          </p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { profile } = useAuth();
  const { data: chatbots, isLoading } = useChatbots();
  const { data: stats } = useAllConversationStats();
  const deleteMutation = useDeleteChatbot();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleDelete = (id: string) => {
    if (!confirm('Delete this chatbot? This cannot be undone.')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Chatbot deleted'),
      onError: () => toast.error('Failed to delete chatbot'),
    });
  };

  const handleNewBot = () => {
    if (!canCreateChatbot(profile, chatbots?.length ?? 0)) {
      setUpgradeOpen(true);
    }
  };

  const usagePercent = profile?.message_limit
    ? Math.min(100, Math.round(((profile.monthly_message_count ?? 0) / profile.message_limit) * 100))
    : 0;
  const usageColor = usagePercent > 90 ? 'text-destructive' : usagePercent > 60 ? 'text-warning' : 'text-success';

  return (
    <PageWrapper>
      <SEO title="Dashboard" noIndex />
      <div className="flex gap-6">
        <div className="flex-1">
          {/* Welcome banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="auth-mesh-bg mb-6 rounded-xl border border-border p-6"
          >
            <h1 className="font-display text-2xl font-bold text-foreground">
              Welcome back, <span className="gradient-text">{profile?.full_name || 'there'}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {chatbots?.length ? `You have ${chatbots.length} chatbot${chatbots.length > 1 ? 's' : ''} running.` : 'Create your first chatbot to get started.'}
            </p>
          </motion.div>

          {/* 80% message limit warning */}
          {isNearMessageLimit(profile) && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning bg-warning/10 p-3 text-sm text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>You've used {profile?.monthly_message_count ?? 0} of {profile?.message_limit ?? 500} messages this month. <button onClick={() => setUpgradeOpen(true)} className="font-semibold underline">Upgrade to Premium</button> for more.</span>
            </div>
          )}

          {/* Stats */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Bot} label="Chatbots" value={chatbots?.length ?? 0} colorIdx={0} />
            <StatCard icon={MessageSquare} label="Conversations" value={stats?.totalConversations ?? 0} colorIdx={1} />
            <StatCard icon={BarChart3} label="Messages" value={profile?.monthly_message_count ?? 0} colorIdx={2} />
            <StatCard icon={Zap} label="Plan" value={isPremium(profile) ? 1 : 0} colorIdx={3} />
          </div>

          {/* Usage bar */}
          <div className="mb-6 glass-card rounded-lg p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Monthly Usage</span>
              <span className={`font-mono font-medium ${usageColor}`}>
                {profile?.monthly_message_count ?? 0} / {profile?.message_limit ?? 500}
              </span>
            </div>
            <Progress value={usagePercent} className="mt-2 h-1.5 bg-muted" />
          </div>

          {/* New chatbot button */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Your Chatbots</h2>
            {canCreateChatbot(profile, chatbots?.length ?? 0) ? (
              <Link
                to="/builder/new"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> New Chatbot
              </Link>
            ) : (
              <button
                onClick={handleNewBot}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> New Chatbot
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-lg glass-card" />
              ))}
            </div>
          ) : chatbots?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {chatbots.map((bot, i) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                >
                  <ChatbotCard chatbot={bot} onDelete={handleDelete} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card glow-border flex flex-col items-center justify-center rounded-xl py-16">
              <span className="mb-3 text-5xl animate-pulse-glow">🤖</span>
              <h2 className="mb-1 font-display text-lg font-bold text-foreground">No chatbots yet</h2>
              <p className="mb-4 text-sm text-muted-foreground">Create your first AI chatbot in minutes</p>
              <Link
                to="/builder/new"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Create Chatbot
              </Link>
            </div>
          )}
        </div>

        <div className="hidden w-56 shrink-0 lg:block">
          <AdSidebar />
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </PageWrapper>
  );
};

export default Dashboard;
