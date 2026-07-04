import { useAuth } from '@/context/AuthContext';
import { useChatbots, useDeleteChatbot, useDuplicateChatbot } from '@/hooks/useChatbot';
import { useAllConversationStats } from '@/hooks/useConversations';
import { useFAQs } from '@/hooks/useFAQs';
import { canCreateChatbot, isPremium, isNearMessageLimit } from '@/lib/plans';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import AdSidebar from '@/components/ads/AdSidebar';
import UpgradeModal from '@/components/billing/UpgradeModal';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import HealthScore, { calculateHealthScore } from '@/components/chatbot/HealthScore';
import InstallBanner from '@/components/pwa/InstallBanner';
import { Progress } from '@/components/ui/progress';
import EmptyState from '@/components/ui/illustrations/EmptyState';
import { AlertTriangle, MoreHorizontal, Activity, Cpu, Plug, MessageSquare, Mail, FlaskConical } from 'lucide-react';
import { PlusIcon, ChevronRightIcon, SettingsIcon, LaunchIcon, CopyIcon, TrashIcon } from '@/components/ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BotAvatar from '@/components/chatbot/BotAvatar';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const Dashboard = () => {
  const { profile, user, isAdmin, loading } = useAuth();
  const { data: chatbots, isLoading } = useChatbots();
  const { data: stats } = useAllConversationStats();
  const deleteMutation = useDeleteChatbot();
  const duplicateMutation = useDuplicateChatbot();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true });
    else if (localStorage.getItem('pending_wizard') === 'true') {
      navigate('/builder/new?wizard=1', { replace: true });
    }
  }, [isAdmin, navigate]);

  if (isAdmin && !loading) return null;

  const handleDelete = (id: string) => {
    if (!confirm('Delete this chatbot? This cannot be undone.')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Chatbot deleted'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to delete chatbot'),
    });
  };

  const handleDuplicate = (id: string) => {
    if (!canCreateChatbot(profile, chatbots?.length ?? 0)) {
      setUpgradeOpen(true);
      return;
    }
    duplicateMutation.mutate(id, {
      onSuccess: () => toast.success('Chatbot duplicated'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to duplicate chatbot'),
    });
  };

  const handleNewBot = () => {
    if (!canCreateChatbot(profile, chatbots?.length ?? 0)) {
      setUpgradeOpen(true);
    } else {
      navigate('/builder/new');
    }
  };

  const usagePercent = profile?.message_limit
    ? Math.min(100, Math.round(((profile.monthly_message_count ?? 0) / profile.message_limit) * 100))
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = profile?.full_name || user?.email?.split('@')[0] || 'there';

  const tips: { condition: boolean; text: string; action?: { label: string; to?: string; onClick?: () => void } }[] = [
    {
      condition: !chatbots?.length,
      text: 'Create your first chatbot to start engaging with visitors.',
      action: { label: 'Create Chatbot', to: '/builder/new' },
    },
    {
      condition: !!chatbots?.length && !chatbots.some(b => b.embed_token),
      text: 'Deploy your chatbot on your website to start collecting conversations.',
      action: { label: 'Deploy Now', onClick: () => { const firstBot = chatbots?.[0]; if (firstBot) navigate(`/chatbot/${firstBot.id}/deploy`); } },
    },
    {
      condition: !!chatbots?.some(b => b.embed_token) && (stats?.totalConversations ?? 0) === 0,
      text: 'Your chatbots are deployed but have no conversations yet. Try customizing your welcome message.',
    },
  ];
  const activeTip = tips.find(t => t.condition);

  const statItems = [
    { label: 'CHATBOTS', value: chatbots?.length ?? 0 },
    { label: 'CONVERSATIONS', value: stats?.totalConversations ?? 0 },
    { label: 'MESSAGES', value: profile?.monthly_message_count ?? 0 },
    { label: 'PLAN', value: isPremium(profile) ? 'Premium' : 'Free' },
  ];

  // Onboarding context
  const firstBotId = chatbots?.[0]?.id;
  const onboardingCtx = {
    chatbots: chatbots ?? [],
    faqCount: 0, // simplified — count not easily available without extra query
    hasDeployed: chatbots?.some(b => b.embed_token) ?? false,
    profileComplete: !!(profile?.full_name && profile?.avatar_url),
  };

  return (
    <PageWrapper>
      <SEO title="Dashboard" noIndex />
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <h1 className="text-[22px] font-semibold text-foreground">
              {greeting}, {name} 👋
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Here&apos;s what&apos;s happening with your chatbots.
            </p>
          </motion.div>

          {/* Install banner */}
          <InstallBanner />

          {/* Onboarding */}
          <OnboardingChecklist ctx={onboardingCtx} />

          {/* Message limit warning */}
          {isNearMessageLimit(profile) && (
            <div className="mb-6 flex items-center gap-3 rounded-[10px] border border-warning/20 bg-warning/5 px-4 py-3 text-[13px] text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {profile?.monthly_message_count ?? 0} of {profile?.message_limit ?? 500} messages used.{' '}
                <button onClick={() => setUpgradeOpen(true)} className="text-primary font-semibold">Upgrade</button>
              </span>
            </div>
          )}

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="mb-8 flex flex-wrap items-center rounded-[14px] border border-border bg-card p-5"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            {statItems.map((stat, i) => (
              <div key={stat.label} className="flex flex-1 min-w-[80px] flex-col items-center relative py-1">
                {i > 0 && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border hidden sm:block" />
                )}
                <span className="text-[32px] font-semibold leading-none text-foreground tracking-tight">
                  <AnimatedCounter value={typeof stat.value === 'number' ? stat.value : 0} />
                </span>
                <span className="mt-1.5 text-[11px] font-medium tracking-[0.06em] text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Spend cap meter */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="mb-8 rounded-[14px] border border-border bg-card p-5"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-foreground">Monthly message usage</span>
              <span className="text-[12px] tabular-nums text-muted-foreground">
                <span className="font-semibold text-foreground">{profile?.monthly_message_count ?? 0}</span>
                {' '}/ {profile?.message_limit ?? 500}
              </span>
            </div>
            <Progress
              value={usagePercent}
              className={`h-2 bg-muted [&>div]:transition-all [&>div]:duration-500 ${
                usagePercent >= 90 ? '[&>div]:bg-destructive' :
                usagePercent >= 70 ? '[&>div]:bg-warning' :
                '[&>div]:bg-success'
              }`}
            />
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className={`font-medium ${
                usagePercent >= 90 ? 'text-destructive' :
                usagePercent >= 70 ? 'text-warning' :
                'text-success'
              }`}>
                {usagePercent >= 90 ? 'Critical' :
                 usagePercent >= 70 ? 'Approaching limit' :
                 usagePercent >= 30 ? 'On track' : 'Low usage'}
              </span>
              <span className="text-muted-foreground">
                {(profile?.message_limit ?? 500) - (profile?.monthly_message_count ?? 0)} remaining
              </span>
              {usagePercent >= 80 && (
                <button onClick={() => setUpgradeOpen(true)} className="text-[11px] text-primary hover:underline font-medium ml-2">
                  Upgrade to increase
                </button>
              )}
            </div>
          </motion.div>

          {/* Tips card */}
          {activeTip && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mb-6 flex items-center gap-3 rounded-[12px] border border-border/60 bg-[hsl(var(--color-surface-1))] px-4 py-3"
            >
              <span className="text-[13px] text-muted-foreground flex-1">{activeTip.text}</span>
              {activeTip.action && (
                activeTip.action.to ? (
                  <Link
                    to={activeTip.action.to}
                    className="shrink-0 rounded-[8px] bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {activeTip.action.label}
                  </Link>
                ) : activeTip.action.onClick ? (
                  <button
                    onClick={activeTip.action.onClick}
                    className="shrink-0 rounded-[8px] bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {activeTip.action.label}
                  </button>
                ) : null
              )}
            </motion.div>
          )}

          {/* Section header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-foreground">Your Chatbots</h2>
            <button
              onClick={handleNewBot}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <PlusIcon className="h-3.5 w-3.5" /> New Chatbot
            </button>
          </div>

          {/* Chatbot grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-[14px] border border-border bg-card p-5 animate-pulse" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-20 rounded bg-muted" />
                      <div className="h-2 w-full rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : chatbots?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {chatbots.map((bot, i) => {
                const healthScore = calculateHealthScore(bot, 0);
                return (
                  <motion.div
                    key={bot.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                    className="group relative rounded-[14px] border border-border bg-card p-5 cursor-pointer transition-all hover:border-border/80 hover:shadow-md active:scale-[0.98]"
                    style={{ boxShadow: 'var(--shadow-sm)' }}
                    onClick={() => navigate(`/chatbot/${bot.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <BotAvatar
                        avatarEmoji={bot.avatar_emoji || 'bot'}
                        botName={bot.name}
                        accentColor={bot.primary_color || 'hsl(211 100% 52%)'}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-foreground truncate pr-6">{bot.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${bot.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                          <span className="text-[11px] text-muted-foreground">
                            {bot.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Chatbot options"
                            className="absolute right-3 top-3 rounded-[6px] p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-[hsl(var(--color-surface-3))] hover:text-foreground transition-all"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => navigate(`/builder/${bot.id}/edit`)}>
                            <SettingsIcon className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/chatbot/${bot.id}/deploy`)}>
                            <LaunchIcon className="mr-2 h-3.5 w-3.5" /> Deploy
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(bot.id)}>
                            <CopyIcon className="mr-2 h-3.5 w-3.5" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/lighthouse/${bot.id}`)}>
                            <Activity className="mr-2 h-3.5 w-3.5" /> Lighthouse
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/integrations/${bot.id}`)}>
                            <Plug className="mr-2 h-3.5 w-3.5" /> Integrations
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/model-settings/${bot.id}`)}>
                            <Cpu className="mr-2 h-3.5 w-3.5" /> Model
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/orchestration/${bot.id}`)}>
                            <Activity className="mr-2 h-3.5 w-3.5" /> Orchestration
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/intelligence-studio/${bot.id}`)}>
                            <MessageSquare className="mr-2 h-3.5 w-3.5" /> Intelligence
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/follow-up-emails/${bot.id}`)}>
                            <Mail className="mr-2 h-3.5 w-3.5" /> Follow-Ups
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/ab-testing/${bot.id}`)}>
                            <FlaskConical className="mr-2 h-3.5 w-3.5" /> A/B Testing
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(bot.id)} className="text-destructive focus:text-destructive">
                            <TrashIcon className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <HealthScore score={healthScore} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-muted-foreground">Conversations</span>
                          <span className="tabular-nums font-medium text-foreground">{bot.total_conversations ?? 0}</span>
                        </div>
                        <Progress
                          value={Math.min(100, (bot.total_conversations ?? 0) * 10)}
                          className="mt-1.5 h-1 bg-muted"
                        />
                        <p className="mt-1 text-[11px] text-muted-foreground capitalize truncate">
                          Tone: {bot.tone || 'Default'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {/* Create card */}
              <button
                onClick={handleNewBot}
                className="rounded-[14px] border-2 border-dashed border-border/60 bg-transparent p-5 flex flex-col items-center justify-center gap-2 transition-all hover:border-primary/40 hover:bg-primary/[0.02] active:scale-[0.98] min-h-[140px]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <PlusIcon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[13px] font-medium text-foreground">New Chatbot</span>
                <span className="text-[11px] text-muted-foreground">Create another chatbot</span>
              </button>
            </div>
          ) : (
            <EmptyState
              title="No chatbots yet"
              description="Create your first AI chatbot in minutes"
              action={
                <Link
                  to="/builder/new"
                  className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground"
                >
                  <PlusIcon className="h-3.5 w-3.5" /> Create Chatbot
                </Link>
              }
            />
          )}
        </div>

        {!isPremium(profile) && (
          <div className="hidden w-52 shrink-0 lg:block">
            <AdSidebar />
          </div>
        )}
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </PageWrapper>
  );
};

export default Dashboard;
