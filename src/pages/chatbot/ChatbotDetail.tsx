import { useParams, Link } from 'react-router-dom';
import { useChatbot } from '@/hooks/useChatbot';
import { useFAQs } from '@/hooks/useFAQs';
import { useConversations } from '@/hooks/useConversations';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import BotAvatar from '@/components/chatbot/BotAvatar';
import { MessageSquare, FileQuestion, BarChart3, Rocket, Settings } from 'lucide-react';

const statConfig = [
  { label: 'Conversations', key: 'convos', color: 'bg-primary/10 text-primary', icon: MessageSquare },
  { label: 'FAQs', key: 'faqs', color: 'bg-success/10 text-success', icon: FileQuestion },
  { label: 'Tone', key: 'tone', color: 'bg-warning/10 text-warning', icon: Settings },
  { label: 'Messages', key: 'msgs', color: 'bg-secondary/10 text-secondary', icon: BarChart3 },
];

const ChatbotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot, isLoading } = useChatbot(id!);
  const { data: faqs } = useFAQs(id!);
  const { data: conversations } = useConversations(id!);

  if (isLoading) return <PageWrapper><div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div></PageWrapper>;
  if (!chatbot) return <PageWrapper><p className="text-muted-foreground">Chatbot not found</p></PageWrapper>;

  const statValues: Record<string, string | number> = {
    convos: chatbot.total_conversations ?? 0,
    faqs: faqs?.length ?? 0,
    tone: chatbot.tone || 'N/A',
    msgs: conversations?.reduce((a, c) => a + (Array.isArray(c.messages) ? c.messages.length : 0), 0) ?? 0,
  };

  const links = [
    { to: `/chatbot/${id}/faqs`, icon: FileQuestion, label: 'FAQs', count: faqs?.length ?? 0 },
    { to: `/chatbot/${id}/analytics`, icon: BarChart3, label: 'Analytics', count: conversations?.length ?? 0 },
    { to: `/chatbot/${id}/deploy`, icon: Rocket, label: 'Deploy', count: null },
    { to: `/builder/${id}/edit`, icon: Settings, label: 'Edit', count: null },
  ];

  const accentColor = chatbot.primary_color || 'hsl(190 100% 50%)';

  return (
    <PageWrapper>
      <SEO title={chatbot.name} noIndex />
      <div className="mb-6 flex items-center gap-4">
        <BotAvatar avatarEmoji={chatbot.avatar_emoji} botName={chatbot.name} accentColor={accentColor} size="lg" />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{chatbot.name}</h1>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`relative inline-block h-2 w-2 rounded-full ${
                chatbot.is_active ? 'bg-success pulse-dot' : 'bg-muted-foreground'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {chatbot.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statConfig.map(({ label, key, color, icon: Icon }) => (
          <div key={key} className="glass-card glow-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color.split(' ')[0]}`}>
                <Icon className={`h-4 w-4 ${color.split(' ')[1]}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-display text-lg font-bold capitalize text-foreground">{statValues[key]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map(({ to, icon: Icon, label, count }) => (
          <Link
            key={to}
            to={to}
            className="glass-card glow-border card-hover flex items-center gap-3 rounded-lg p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
              {count !== null && <p className="text-xs text-muted-foreground">{count} items</p>}
            </div>
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
};

export default ChatbotDetail;
