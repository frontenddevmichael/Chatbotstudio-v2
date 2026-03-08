import { useParams } from 'react-router-dom';
import { useChatbot } from '@/hooks/useChatbot';
import { useConversations } from '@/hooks/useConversations';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

const Analytics = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot } = useChatbot(id!);
  const { data: conversations, isLoading } = useConversations(id!);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <PageWrapper><div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div></PageWrapper>;

  const totalConvos = conversations?.length ?? 0;
  const totalMessages = conversations?.reduce((a, c) => a + (Array.isArray(c.messages) ? c.messages.length : 0), 0) ?? 0;
  const avgLength = totalConvos ? Math.round(totalMessages / totalConvos) : 0;

  // Build chart data - conversations per day for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map((day) => ({
    day: day.slice(5),
    count: conversations?.filter((c) => c.started_at?.startsWith(day)).length ?? 0,
  }));

  // Top questions
  const questionCounts: Record<string, number> = {};
  conversations?.forEach((c) => {
    if (Array.isArray(c.messages)) {
      c.messages.forEach((m: any) => {
        if (m.role === 'user') {
          const q = String(m.content).slice(0, 80);
          questionCounts[q] = (questionCounts[q] || 0) + 1;
        }
      });
    }
  });
  const topQuestions = Object.entries(questionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <PageWrapper>
      <SEO title={`Analytics - ${chatbot?.name || 'Chatbot'}`} noIndex />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Analytics — {chatbot?.name}</h1>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Conversations</p>
          <p className="font-display text-2xl font-bold text-foreground">{totalConvos}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Messages</p>
          <p className="font-display text-2xl font-bold text-foreground">{totalMessages}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Avg Length</p>
          <p className="font-display text-2xl font-bold text-foreground">{avgLength} msgs</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Conversations (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: 'hsl(240 10% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(240 10% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(240 15% 8%)', border: '1px solid hsl(240 15% 18%)', borderRadius: 8, color: 'hsl(240 20% 96%)' }}
            />
            <Bar dataKey="count" fill="hsl(190 100% 50%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top questions */}
      {topQuestions.length > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Top Questions</h3>
          <div className="space-y-2">
            {topQuestions.map(([q, count]) => (
              <div key={q} className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground">{q}</span>
                <span className="ml-2 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent conversations */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Conversations</h3>
        {!conversations?.length ? (
          <p className="text-sm text-muted-foreground">No conversations yet</p>
        ) : (
          <div className="space-y-2">
            {conversations.slice(0, 10).map((convo) => (
              <div key={convo.id} className="rounded-md border border-border bg-muted p-3">
                <button
                  onClick={() => setExpandedId(expandedId === convo.id ? null : convo.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {Array.isArray(convo.messages) ? convo.messages.length : 0} messages
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {convo.started_at ? new Date(convo.started_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  {expandedId === convo.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {expandedId === convo.id && Array.isArray(convo.messages) && (
                  <div className="mt-3 space-y-2">
                    {convo.messages.map((msg: any, i: number) => (
                      <div key={i} className={`rounded p-2 text-xs ${msg.role === 'user' ? 'bg-primary/5 text-foreground' : 'bg-card text-muted-foreground'}`}>
                        <span className="font-semibold">{msg.role === 'user' ? 'User' : 'Bot'}: </span>
                        {String(msg.content).slice(0, 200)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Analytics;
