import { useParams, Link } from 'react-router-dom';
import { useChatbot } from '@/hooks/useChatbot';
import { useFAQs } from '@/hooks/useFAQs';
import { useConversations } from '@/hooks/useConversations';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import BotAvatar from '@/components/chatbot/BotAvatar';
import { MessageSquare, FileQuestion, BarChart3, Rocket, Settings, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ChatbotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot, isLoading } = useChatbot(id!);
  const { data: faqs } = useFAQs(id!);
  const { data: conversations } = useConversations(id!);

  if (isLoading) return <PageWrapper><div className="flex justify-center py-20"><Spinner className="h-6 w-6" /></div></PageWrapper>;
  if (!chatbot) return <PageWrapper><p className="text-[13px] text-muted-foreground">Chatbot not found</p></PageWrapper>;

  const totalMessages = conversations?.reduce((a, c) => a + (Array.isArray(c.messages) ? c.messages.length : 0), 0) ?? 0;

  const stats = [
    { label: 'CONVERSATIONS', value: chatbot.total_conversations ?? 0 },
    { label: 'FAQS', value: faqs?.length ?? 0 },
    { label: 'MESSAGES', value: totalMessages },
    { label: 'TONE', value: chatbot.tone || 'N/A' },
  ];

  const links = [
    { to: `/chatbot/${id}/faqs`, icon: FileQuestion, label: 'FAQs', desc: `${faqs?.length ?? 0} questions` },
    { to: `/chatbot/${id}/analytics`, icon: BarChart3, label: 'Analytics', desc: `${conversations?.length ?? 0} conversations` },
    { to: `/chatbot/${id}/deploy`, icon: Rocket, label: 'Deploy', desc: 'Embed & share' },
    { to: `/builder/${id}/edit`, icon: Settings, label: 'Edit', desc: 'Customize bot' },
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
            <span className="font-serif text-[28px] italic leading-none text-foreground capitalize">{s.value}</span>
            <span className="mt-1.5 text-[11px] font-medium tracking-[0.06em] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

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
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
};

export default ChatbotDetail;
