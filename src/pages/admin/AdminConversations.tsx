import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/adminApi';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import type { AdminConversation, ChatMessage } from '@/types/admin';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { SearchIcon, ChatIcon, TrashIcon } from '@/components/ui/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDistanceToNow, subDays } from 'date-fns';
import { toast } from 'sonner';
import { sanitizeText } from '@/lib/sanitize';
import EmptyState from '@/components/ui/illustrations/EmptyState';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminConversations = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [botFilter, setBotFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: chatbots } = useQuery({ queryKey: ['admin-chatbots-map'], queryFn: () => adminFetch<Record<string,{name:string;emoji:string|null}>>('get-chatbot-map') });
  const { data: conversations, isLoading } = useQuery({ queryKey: ['admin-conversations'], queryFn: () => adminFetch<AdminConversation[]>('get-conversations') });

  const filtered = useMemo(() => {
    let result = conversations ?? [];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((c) => {
        const botName = chatbots?.[c.chatbot_id]?.name?.toLowerCase() ?? '';
        return botName.includes(q) || c.session_id?.toLowerCase().includes(q);
      });
    }
    if (botFilter !== 'all') result = result.filter((c) => c.chatbot_id === botFilter);
    if (dateFilter !== 'all') {
      const days = dateFilter === 'today' ? 1 : dateFilter === '7d' ? 7 : 30;
      const cutoff = subDays(new Date(), days).toISOString();
      result = result.filter((c) => (c.last_message_at ?? c.started_at) >= cutoff);
    }
    return result;
  }, [conversations, chatbots, debouncedSearch, botFilter, dateFilter]);

  const getMessageCount = (msgs: ChatMessage[] | null) => Array.isArray(msgs) ? msgs.length : 0;

  const deleteConvo = useMutation({
    mutationFn: (id: string) => adminFetch('delete-conversation', { id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-conversations'] }); toast.success('Conversation deleted'); setDeleteConfirm(null); },
    onError: (err) => { toast.error(err instanceof Error ? err.message : 'Failed to delete conversation'); setDeleteConfirm(null); },
  });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'conversations-export.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const botList = useMemo(() => {
    if (!chatbots) return [];
    return Object.entries(chatbots).map(([id, bot]) => ({ id, name: bot.name, emoji: bot.emoji }));
  }, [chatbots]);

  return (
    <AdminLayout>
      <SEO title="All Conversations" noIndex />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Conversations ({filtered.length})</h1>
        <button onClick={exportJSON} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" /> Export JSON
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by bot name or session..." className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
        </div>
        <select value={botFilter} onChange={(e) => setBotFilter(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="all">All Bots</option>
          {botList.map(b => <option key={b.id} value={b.id}>{b.emoji} {b.name}</option>)}
        </select>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded bg-card" />)}</div>
        ) : !filtered.length ? (
          <EmptyState
            title="No conversations found"
            description="Conversations will appear here once users start chatting with your chatbots."
          />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const bot = chatbots?.[c.chatbot_id];
            const msgCount = getMessageCount(c.messages);
            const isOpen = expanded === c.id;
            const messages: ChatMessage[] = Array.isArray(c.messages) ? c.messages : [];

            return (
              <div key={c.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="flex w-full items-center gap-3 px-4 py-3 text-sm">
                  <button onClick={() => setExpanded(isOpen ? null : c.id)} className="flex flex-1 items-center gap-3 text-left hover:opacity-80 transition-opacity">
                    <span className="text-lg">{bot?.emoji ?? '🤖'}</span>
                    <span className="flex-1 truncate font-medium text-foreground">{bot?.name ?? 'Unknown Bot'}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{msgCount} msgs</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {c.last_message_at ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true }) : ''}
                    </span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => setDeleteConfirm(c.id)} className="text-muted-foreground hover:text-destructive shrink-0"><TrashIcon className="h-3.5 w-3.5" /></button>
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-muted/30 px-4 py-3">
                    <p className="mb-2 text-[11px] text-muted-foreground">Session: {c.session_id ?? 'N/A'}</p>
                    {messages.length ? (
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {messages.map((msg, i) => (
                          <div key={i} className={`rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'ml-8 bg-primary/10 text-foreground' : 'mr-8 bg-card border border-border text-foreground'}`}>
                            <span className="mb-0.5 block text-[10px] font-semibold text-muted-foreground">{msg.role === 'user' ? 'User' : 'Bot'}</span>
                            {sanitizeText(msg.content)}
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

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete this conversation? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && deleteConvo.mutate(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminConversations;
