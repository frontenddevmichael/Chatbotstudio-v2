import { useParams, Link } from 'react-router-dom';
import { useChatbot } from '@/hooks/useChatbot';
import { useFAQs } from '@/hooks/useFAQs';
import { useConversations } from '@/hooks/useConversations';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import BotAvatar from '@/components/chatbot/BotAvatar';
import AutopilotPanel from '@/components/chatbot/AutopilotPanel';
import { ChatIcon, FAQIcon, AnalyticsIcon, LaunchIcon, SettingsIcon, ChevronRightIcon, KnowledgeIcon, BotIcon } from '@/components/ui/icons';
import { motion } from 'framer-motion';

const ChatbotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot, isLoading } = useChatbot(id!);
  const { data: faqs } = useFAQs(id!);
  const { data: conversations } = useConversations(id!);

  if (isLoading) return (
    <PageWrapper>
      <div className="mb-8 flex items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-[hsl(var(--color-surface-2))]" />
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
          <div className="h-3 w-16 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
        </div>
      </div>
      <div className="mb-8 flex items-center rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-1 flex-col items-center relative">
            {i > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border" />}
            <div className="mb-1 h-7 w-14 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
            <div className="h-3 w-16 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
          </div>
        ))}
      </div>
      <div className="rounded-[14px] border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border bg-card px-4 py-3.5 last:border-b-0">
            <div className="h-8 w-8 animate-pulse rounded-[6px] bg-[hsl(var(--color-surface-2))]" />
            <div className="flex-1 space-y-1">
              <div className="h-3.5 w-28 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
              <div className="h-3 w-24 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
            </div>
            <div className="h-4 w-4 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
          </div>
        ))}
      </div>
    </PageWrapper>
  );
  if (!chatbot) return <PageWrapper><p className="text-[13px] text-muted-foreground">Chatbot not found</p></PageWrapper>;

  const totalMessages = conversations?.reduce((a, c) => a + (Array.isArray(c.messages) ? c.messages.length : 0), 0) ?? 0;

  const stats = [
    { label: 'CONVERSATIONS', value: chatbot.total_conversations ?? 0 },
    { label: 'FAQS', value: faqs?.length ?? 0 },
    { label: 'MESSAGES', value: totalMessages },
    { label: 'TONE', value: chatbot.tone || 'N/A' },
  ];

  const links = [
    { to: `/chatbot/${id}/faqs`, icon: FAQIcon, label: 'FAQs', desc: `${faqs?.length ?? 0} questions` },
    { to: `/chatbot/${id}/analytics`, icon: AnalyticsIcon, label: 'Analytics', desc: `${conversations?.length ?? 0} conversations` },
    { to: `/chatbot/${id}/deploy`, icon: LaunchIcon, label: 'Deploy', desc: 'Embed & share' },
    { to: `/builder/${id}/edit`, icon: SettingsIcon, label: 'Edit', desc: 'Customize bot' },
    { to: `/dashboard/model-settings/${id}`, icon: KnowledgeIcon, label: 'Model Settings', desc: 'Tone & personality' },
    { to: `/dashboard/orchestration/${id}`, icon: BotIcon, label: 'Orchestration', desc: 'Routing & automation' },
  ];

  return (
    <PageWrapper>
      <SEO title={chatbot.name} noIndex />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-4"
      >
        <BotAvatar avatarEmoji={chatbot.avatar_emoji} botName={chatbot.name} accentColor={chatbot.primary_color || 'hsl(211 100% 52%)'} size="lg" />
        <div>
          <h1 className="text-[22px] font-semibold text-foreground">{chatbot.name}</h1>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${chatbot.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
            <span className="text-[12px] text-muted-foreground">{chatbot.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mb-8 flex items-center rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {stats.map((s, i) => (
          <div key={s.label} className="flex flex-1 flex-col items-center relative">
            {i > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border" />}
            <span className="text-[28px] font-semibold leading-none text-foreground tracking-tight capitalize">{s.value}</span>
            <span className="mt-1.5 text-[11px] font-medium tracking-[0.06em] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Health Autopilot */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-8 rounded-[14px] border border-border bg-card p-5"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <AutopilotPanel chatbotId={id!} onFaqsChanged={() => window.location.reload()} />
      </motion.div>

      {/* Quick links */}
      <div className="rounded-[14px] border border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {links.map((link, i) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 border-b border-border bg-card px-4 py-3.5 last:border-b-0 transition-colors hover:bg-[hsl(var(--color-surface-2))]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[hsl(var(--color-surface-3))]">
              <link.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-foreground">{link.label}</p>
              <p className="text-[12px] text-muted-foreground">{link.desc}</p>
            </div>
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40" />
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
};

export default ChatbotDetail;
