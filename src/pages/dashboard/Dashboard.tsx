import { useAuth } from '@/context/AuthContext';
import { useChatbots, useDeleteChatbot } from '@/hooks/useChatbot';
import { useAllConversationStats } from '@/hooks/useConversations';
import { canCreateChatbot } from '@/lib/plans';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import ChatbotCard from '@/components/chatbot/ChatbotCard';
import AdSidebar from '@/components/ads/AdSidebar';
import UpgradeModal from '@/components/billing/UpgradeModal';
import { Bot, MessageSquare, BarChart3, Zap, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useState } from 'react';

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  </div>
);

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
      return;
    }
  };

  return (
    <PageWrapper>
      <SEO title="Dashboard" noIndex />
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
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

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Bot} label="Chatbots" value={chatbots?.length ?? 0} />
            <StatCard icon={MessageSquare} label="Conversations" value={stats?.totalConversations ?? 0} />
            <StatCard icon={BarChart3} label="Messages" value={profile?.monthly_message_count ?? 0} />
            <StatCard icon={Zap} label="Plan" value={profile?.plan === 'premium' ? 'Premium' : 'Free'} />
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-card" />
              ))}
            </div>
          ) : chatbots?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {chatbots.map((bot) => (
                <ChatbotCard key={bot.id} chatbot={bot} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16">
              <span className="mb-3 text-5xl">🤖</span>
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
