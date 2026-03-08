import { useParams, Link } from 'react-router-dom';
import { useChatbot } from '@/hooks/useChatbot';
import { useFAQs } from '@/hooks/useFAQs';
import { useConversations } from '@/hooks/useConversations';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { MessageSquare, FileQuestion, BarChart3, Rocket, Settings } from 'lucide-react';

const ChatbotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot, isLoading } = useChatbot(id!);
  const { data: faqs } = useFAQs(id!);
  const { data: conversations } = useConversations(id!);

  if (isLoading) return <PageWrapper><div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div></PageWrapper>;
  if (!chatbot) return <PageWrapper><p className="text-muted-foreground">Chatbot not found</p></PageWrapper>;

  const links = [
    { to: `/chatbot/${id}/faqs`, icon: FileQuestion, label: 'FAQs', count: faqs?.length ?? 0 },
    { to: `/chatbot/${id}/analytics`, icon: BarChart3, label: 'Analytics', count: conversations?.length ?? 0 },
    { to: `/chatbot/${id}/deploy`, icon: Rocket, label: 'Deploy', count: null },
    { to: `/builder/${id}/edit`, icon: Settings, label: 'Edit', count: null },
  ];

  return (
    <PageWrapper>
      <SEO title={chatbot.name} noIndex />
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">{chatbot.avatar_emoji}</span>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{chatbot.name}</h1>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            chatbot.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
          }`}>
            {chatbot.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Conversations</p>
          <p className="font-display text-lg font-bold text-foreground">{chatbot.total_conversations ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">FAQs</p>
          <p className="font-display text-lg font-bold text-foreground">{faqs?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Tone</p>
          <p className="font-display text-lg font-bold capitalize text-foreground">{chatbot.tone}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Messages</p>
          <p className="font-display text-lg font-bold text-foreground">{conversations?.reduce((a, c) => a + (Array.isArray(c.messages) ? c.messages.length : 0), 0) ?? 0}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map(({ to, icon: Icon, label, count }) => (
          <Link
            key={to}
            to={to}
            className="card-hover flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30"
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
