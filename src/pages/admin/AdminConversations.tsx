import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/lib/adminApi';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { Search, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDistanceToNow } from 'date-fns';

const AdminConversations = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: chatbots } = useQuery({
    queryKey: ['admin-chatbots-map'],
    queryFn: () => adminFetch('get-chatbot-map'),
  });

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: () => adminFetch('get-conversations'),
  });

  const filtered = useMemo(() => {
    if (!debouncedSearch) return conversations ?? [];
    const q = debouncedSearch.toLowerCase();
    return (conversations ?? []).filter((c: any) => {
      const botName = chatbots?.[c.chatbot_id]?.name?.toLowerCase() ?? '';
      return botName.includes(q) || c.session_id?.toLowerCase().includes(q);
    });
  }, [conversations, chatbots, debouncedSearch]);

  const getMessageCount = (msgs: any) => Array.isArray(msgs) ? msgs.length : 0;

  return (
    <AdminLayout>
      <SEO title="All Conversations" noIndex />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Conversations</h1>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by bot name or session..."
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded bg-card" />)}
        </div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <MessageSquare className="mb-3 h-10 w-10" />
          <p className="text-sm">No conversations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c: any) => {
            const bot = chatbots?.[c.chatbot_id];
            const msgCount = getMessageCount(c.messages);
            const isOpen = expanded === c.id;
            const messages: any[] = Array.isArray(c.messages) ? c.messages : [];

            return (
              <div key={c.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors"
                >
                  <span className="text-lg">{bot?.emoji ?? '🤖'}</span>
                  <span className="flex-1 truncate font-medium text-foreground">{bot?.name ?? 'Unknown Bot'}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{msgCount} msgs</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true }) : ''}
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-muted/30 px-4 py-3">
                    <p className="mb-2 text-[11px] text-muted-foreground">Session: {c.session_id ?? 'N/A'}</p>
                    {messages.length ? (
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {messages.map((msg: any, i: number) => (
                          <div
                            key={i}
                            className={`rounded-lg px-3 py-2 text-sm ${
                              msg.role === 'user'
                                ? 'ml-8 bg-primary/10 text-foreground'
                                : 'mr-8 bg-card border border-border text-foreground'
                            }`}
                          >
                            <span className="mb-0.5 block text-[10px] font-semibold text-muted-foreground">
                              {msg.role === 'user' ? 'User' : 'Bot'}
                            </span>
                            {msg.content}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No messages</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminConversations;
