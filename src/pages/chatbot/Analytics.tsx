import { useParams } from 'react-router-dom';
import { useChatbot } from '@/hooks/useChatbot';
import { useConversations } from '@/hooks/useConversations';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Analytics = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot } = useChatbot(id!);
  const { data: conversations, isLoading } = useConversations(id!);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <PageWrapper><div className="flex justify-center py-20"><Spinner className="h-6 w-6" /></div></PageWrapper>;

  const totalConvos = conversations?.length ?? 0;
  const totalMessages = conversations?.reduce((a, c) => a + (Array.isArray(c.messages) ? c.messages.length : 0), 0) ?? 0;
  const avgLength = totalConvos ? Math.round(totalMessages / totalConvos) : 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map((day) => ({
    day: day.slice(5),
    count: conversations?.filter((c) => c.started_at?.startsWith(day)).length ?? 0,
  }));

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
  const topQuestions = Object.entries(questionCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxQuestionCount = topQuestions.length ? topQuestions[0][1] : 1;

  const stats = [
    { label: 'CONVERSATIONS', value: totalConvos },
    { label: 'MESSAGES', value: totalMessages },
    { label: 'AVG LENGTH', value: `${avgLength}` },
  ];

  return (
    <PageWrapper>
      <SEO title={`Analytics — ${chatbot?.name || 'Chatbot'}`} noIndex />
      <h1 className="text-[22px] font-semibold text-foreground mb-6">Analytics — {chatbot?.name}</h1>

      {/* Stats */}
      <div className="mb-6 flex items-center rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {stats.map((s, i) => (
          <div key={s.label} className="flex flex-1 flex-col items-center relative">
            {i > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border" />}
            <span className="font-serif text-[32px] italic leading-none text-foreground">{s.value}</span>
            <span className="mt-1.5 text-[11px] font-medium tracking-[0.06em] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-6 rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="mb-4 text-[13px] font-medium text-muted-foreground">Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: 'hsl(0 0% 38%)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(0 0% 38%)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'hsl(0 0% 8%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: 'rgba(255,255,255,0.92)',
                fontSize: 13,
              }}
            />
            <Bar dataKey="count" fill="hsl(211 100% 52%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top questions */}
      {topQuestions.length > 0 && (
        <div className="mb-6 rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="mb-3 text-[13px] font-medium text-muted-foreground">Top Questions</h3>
          <div className="space-y-2">
            {topQuestions.map(([q, count]) => (
              <div key={q} className="relative">
                <div className="absolute inset-y-0 left-0 rounded-[4px] bg-primary/5" style={{ width: `${(count / maxQuestionCount) * 100}%` }} />
                <div className="relative flex items-center justify-between px-2.5 py-1.5 text-[13px]">
                  <span className="truncate text-muted-foreground">{q}</span>
                  <span className="ml-2 shrink-0 rounded-[6px] bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent conversations */}
      <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="mb-3 text-[13px] font-medium text-muted-foreground">Recent Conversations</h3>
        {!conversations?.length ? (
          <p className="text-[13px] text-muted-foreground">No conversations yet</p>
        ) : (
          <div className="space-y-1">
            {conversations.slice(0, 10).map((convo) => (
              <div key={convo.id} className="rounded-[10px] border border-border bg-[hsl(var(--color-surface-2))] overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === convo.id ? null : convo.id)}
                  className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-[hsl(var(--color-surface-3))]"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[12px] text-muted-foreground">
                      {Array.isArray(convo.messages) ? convo.messages.length : 0} messages
                    </span>
                    <span className="text-[12px] text-muted-foreground/50">
                      {convo.started_at ? new Date(convo.started_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  {expandedId === convo.id ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {expandedId === convo.id && Array.isArray(convo.messages) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border p-3 space-y-1.5">
                        {convo.messages.map((msg: any, i: number) => (
                          <div key={i} className={`rounded-[6px] p-2 text-[12px] ${
                            msg.role === 'user' ? 'bg-primary/5 text-foreground' : 'bg-[hsl(var(--color-surface-3))] text-muted-foreground'
                          }`}>
                            <span className="font-medium">{msg.role === 'user' ? 'User' : 'Bot'}: </span>
                            {String(msg.content).slice(0, 200)}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Analytics;
