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
import { Plus, AlertTriangle, ChevronRight, MoreHorizontal, Trash2, Settings, Rocket, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';
import { motion } from 'framer-motion';
import BotAvatar from '@/components/chatbot/BotAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const Dashboard = () => {
  const { profile } = useAuth();
  const { data: chatbots, isLoading } = useChatbots();
  const { data: stats } = useAllConversationStats();
  const deleteMutation = useDeleteChatbot();
  const duplicateMutation = useDuplicateChatbot();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const navigate = useNavigate();

  const handleDelete = (id: string) => {
    if (!confirm('Delete this chatbot? This cannot be undone.')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Chatbot deleted'),
      onError: () => toast.error('Failed to delete chatbot'),
    });
  };

  const handleDuplicate = (id: string) => {
    if (!canCreateChatbot(profile, chatbots?.length ?? 0)) {
      setUpgradeOpen(true);
      return;
    }
    duplicateMutation.mutate(id, {
      onSuccess: () => toast.success('Chatbot duplicated'),
      onError: () => toast.error('Failed to duplicate chatbot'),
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
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground">
              Welcome back, {profile?.full_name || 'there'}
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {chatbots?.length ? `${chatbots.length} chatbot${chatbots.length > 1 ? 's' : ''} running` : 'Create your first chatbot to get started'}
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
                <button onClick={() => setUpgradeOpen(true)} className="font-medium underline underline-offset-2">Upgrade</button>
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
                <span className="font-serif text-[32px] italic leading-none text-foreground">
                  {stat.value}
                </span>
                <span className="mt-1.5 text-[11px] font-medium tracking-[0.06em] text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Usage bar */}
          <div className="mb-8 flex items-center gap-4 text-[13px]">
            <span className="text-muted-foreground">Monthly usage</span>
            <div className="flex-1">
              <Progress value={usagePercent} className="h-1 bg-muted" />
            </div>
            <span className="font-mono text-[12px] text-muted-foreground">
              {profile?.monthly_message_count ?? 0}/{profile?.message_limit ?? 500}
            </span>
          </div>

          {/* Section header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-foreground">Your Chatbots</h2>
            <button
              onClick={handleNewBot}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <Plus className="h-3.5 w-3.5" /> New Chatbot
            </button>
          </div>

          {/* Chatbot list */}
          {isLoading ? (
            <div className="space-y-px rounded-[14px] border border-border overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[64px] bg-card animate-pulse border-b border-border last:border-b-0" />
              ))}
            </div>
          ) : chatbots?.length ? (
            <div className="rounded-[14px] border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
              {chatbots.map((bot, i) => {
                const healthScore = calculateHealthScore(bot, 0);
                return (
                  <motion.div
                    key={bot.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="group flex items-center gap-3 border-b border-border bg-card px-4 py-3 last:border-b-0 transition-colors hover:bg-[hsl(var(--color-surface-2))] cursor-pointer"
                    onClick={() => navigate(`/chatbot/${bot.id}`)}
                  >
                    <BotAvatar
                      avatarEmoji={bot.avatar_emoji || 'bot'}
                      botName={bot.name}
                      accentColor={bot.primary_color || 'hsl(211 100% 52%)'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-foreground truncate">{bot.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${bot.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                        <span className="text-[11px] text-muted-foreground">
                          {bot.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4">
                      <HealthScore score={healthScore} size={36} />
                      <div className="flex flex-col text-[12px] text-muted-foreground">
                        <span className="tabular-nums">{bot.total_conversations ?? 0} convos</span>
                        <span className="capitalize">{bot.tone || '—'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-[6px] p-1.5 text-muted-foreground hover:bg-[hsl(var(--color-surface-3))] hover:text-foreground transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => navigate(`/builder/${bot.id}/edit`)}>
                            <Settings className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/chatbot/${bot.id}/deploy`)}>
                            <Rocket className="mr-2 h-3.5 w-3.5" /> Deploy
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(bot.id)}>
                            <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(bot.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border py-16">
              <span className="mb-3 text-4xl">🤖</span>
              <h3 className="text-[15px] font-medium text-foreground">No chatbots yet</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">Create your first AI chatbot in minutes</p>
              <Link
                to="/builder/new"
                className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Create Chatbot
              </Link>
            </div>
          )}
        </div>

        <div className="hidden w-52 shrink-0 lg:block">
          <AdSidebar />
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </PageWrapper>
  );
};

export default Dashboard;
