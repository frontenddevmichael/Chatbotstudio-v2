import { useParams } from 'react-router-dom';
import { useChatbot } from '@/hooks/useChatbot';
import { useConversations } from '@/hooks/useConversations';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import EmptyState from '@/components/ui/illustrations/EmptyState';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { ChatIcon } from '@/components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

const Analytics = () => {
  const { id } = useParams<{ id: string }>();
  const { data: chatbot } = useChatbot(id!);
  const { data: conversations, isLoading } = useConversations(id!);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return (
    <PageWrapper>
      <div className="mb-6 h-6 w-52 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
      <div className="mb-6 flex items-center rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-1 flex-col items-center relative">
            {i > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border" />}
            <div className="mb-1.5 h-8 w-14 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
          </div>
        ))}
      </div>
      <div className="mb-6 rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="mb-4 h-3.5 w-24 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
        <div className="h-[180px] w-full animate-pulse rounded-[8px] bg-[hsl(var(--color-surface-2))]" />
      </div>
      <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="mb-3 h-3.5 w-32 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between px-2.5 py-1.5">
              <div className="h-3.5 w-48 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
              <div className="h-5 w-8 animate-pulse rounded-[6px] bg-[hsl(var(--color-surface-2))]" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="mb-3 h-3.5 w-32 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-[10px] border border-border bg-[hsl(var(--color-surface-2))] p-3">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
                <div className="h-3 w-20 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
              </div>
              <div className="h-3 w-16 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );

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
      c.messages.forEach((m) => {
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

      <div className="mb-6 flex items-center rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {stats.map((s, i) => (
          <div key={s.label} className="flex flex-1 flex-col items-center relative">
            {i > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-border" />}
            <span className="text-[32px] font-semibold leading-none text-foreground tracking-tight">{s.value}</span>
            <span className="mt-1.5 text-[11px] font-medium tracking-[0.06em] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <h3 className="mb-4 text-[13px] font-medium text-muted-foreground">Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border)/0.15)',
                borderRadius: 10,
                color: 'hsl(var(--foreground))',
                fontSize: 13,
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

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

      {!conversations?.length ? (
        <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <EmptyState
            icon={<MessageSquare className="h-8 w-8 text-muted-foreground/40" />}
            title="No conversations yet"
            description="Conversation data will appear once visitors start chatting."
          />
        </div>
      ) : (
        <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="mb-3 text-[13px] font-medium text-muted-foreground">Recent Conversations</h3>
          <div className="space-y-1">
            {conversations.slice(0, 10).map((convo) => (
              <div key={convo.id} className="rounded-[10px] border border-border bg-[hsl(var(--color-surface-2))] overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === convo.id ? null : convo.id)}
                  className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-[hsl(var(--color-surface-3))]"
                >
                  <div className="flex items-center gap-2">
                    <ChatIcon className="h-3.5 w-3.5 text-muted-foreground" />
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
                        {convo.messages.map((msg, i) => (
                          <div key={i} className="rounded-[6px] p-2 text-[12px]"
                            style={{
                              backgroundColor: msg.role === 'user' ? 'hsl(var(--primary)/0.05)' : 'hsl(var(--color-surface-3))',
                              color: msg.role === 'user' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                            }}
                          >
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
        </div>
      )}
    </PageWrapper>
  );
};

export default Analytics;
