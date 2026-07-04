import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/adminApi';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import { Download, ChevronUp, ChevronDown } from 'lucide-react';
import { SearchIcon, TrashIcon } from '@/components/ui/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { Link } from 'react-router-dom';
import type { AdminChatbot } from '@/types/admin';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type SortKey = 'name' | 'total_conversations' | 'faqs' | 'created_at';
type SortDir = 'asc' | 'desc';

const ChatbotManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [detailBot, setDetailBot] = useState<AdminChatbot | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: chatbots, isLoading } = useQuery({ queryKey: ['admin-chatbots'], queryFn: () => adminFetch<AdminChatbot[]>('get-chatbots') });
  const { data: owners } = useQuery({ queryKey: ['admin-chatbot-owners'], queryFn: () => adminFetch<Record<string,string>>('get-owners') });
  const { data: faqCounts } = useQuery({ queryKey: ['admin-faq-counts'], queryFn: () => adminFetch<Record<string,number>>('get-faq-counts') });

  const filtered = useMemo(() => {
    let result = chatbots ?? [];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((b) => b.name?.toLowerCase().includes(q) || owners?.[b.user_id]?.toLowerCase().includes(q));
    }
    if (statusFilter === 'active') result = result.filter((b) => b.is_active);
    if (statusFilter === 'inactive') result = result.filter((b) => !b.is_active);

    result = [...result].sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      if (sortKey === 'faqs') { aVal = faqCounts?.[a.id] ?? 0; bVal = faqCounts?.[b.id] ?? 0; }
      else if (sortKey === 'total_conversations') { aVal = a.total_conversations ?? 0; bVal = b.total_conversations ?? 0; }
      else if (sortKey === 'created_at') { aVal = a.created_at ?? ''; bVal = b.created_at ?? ''; }
      else { aVal = (a.name || '').toLowerCase(); bVal = (b.name || '').toLowerCase(); }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [chatbots, debouncedSearch, statusFilter, owners, sortKey, sortDir, faqCounts]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminFetch('toggle-bot-active', { id, is_active }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-chatbots'] }); toast.success('Chatbot updated'); },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update chatbot'),
  });

  const deleteChatbot = useMutation({
    mutationFn: (id: string) => adminFetch('delete-chatbot', { id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-chatbots'] }); toast.success('Chatbot deleted'); setDeleteConfirm(null); },
    onError: (err) => { toast.error(err instanceof Error ? err.message : 'Failed to delete'); setDeleteConfirm(null); },
  });

  const sanitizeCSV = (val: string): string => /^[=+\-@]/.test(val) ? `'${val}` : val;

  const exportCSV = () => {
    const rows = filtered.map((b) => ({
      Name: sanitizeCSV(b.name), Owner: sanitizeCSV(owners?.[b.user_id] ?? 'Unknown'), Status: b.is_active ? 'Active' : 'Inactive',
      FAQs: faqCounts?.[b.id] ?? 0, Conversations: b.total_conversations ?? 0,
      Created: b.created_at ? new Date(b.created_at).toLocaleDateString() : '',
    }));
    const header = Object.keys(rows[0] || {}).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'chatbots-export.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <AdminLayout>
      <SEO title="Chatbot Management" noIndex />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">All Chatbots ({filtered.length})</h1>
        <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or owner..." className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-card" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('name')}>Bot <SortIcon col="name" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('faqs')}>FAQs <SortIcon col="faqs" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('total_conversations')}>Convos <SortIcon col="total_conversations" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort('created_at')}>Created <SortIcon col="created_at" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bot) => (
                <tr key={bot.id} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => setDetailBot(bot)}>
                  <td className="px-4 py-3"><span className="mr-2">{bot.avatar_emoji}</span><span className="text-foreground">{bot.name}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{owners?.[bot.user_id] ?? 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${bot.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{bot.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{faqCounts?.[bot.id] ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{bot.total_conversations ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{bot.created_at ? new Date(bot.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive.mutate({ id: bot.id, is_active: bot.is_active })} aria-label="Toggle chatbot active status" className="text-xs font-medium text-primary hover:underline">{bot.is_active ? 'Deactivate' : 'Activate'}</button>
                      <Link to="/admin/conversations" className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline">Convos</Link>
                      <button onClick={() => setDeleteConfirm({ id: bot.id, name: bot.name })} aria-label="Delete chatbot" className="text-xs text-muted-foreground hover:text-destructive"><TrashIcon className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No chatbots found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailBot} onOpenChange={(open) => !open && setDetailBot(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailBot?.avatar_emoji} {detailBot?.name}</DialogTitle>
            <DialogDescription>Chatbot details</DialogDescription>
          </DialogHeader>
          {detailBot && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Owner</p><p className="font-medium text-foreground">{owners?.[detailBot.user_id] ?? 'Unknown'}</p></div>
                <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Status</p><p className="font-medium text-foreground">{detailBot.is_active ? 'Active' : 'Inactive'}</p></div>
                <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Tone</p><p className="font-medium text-foreground capitalize">{detailBot.tone || 'friendly'}</p></div>
                <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Color</p><div className="flex items-center gap-2"><div className="h-4 w-4 rounded" style={{ background: detailBot.primary_color || '#00d4ff' }} /><span className="font-mono text-xs text-foreground">{detailBot.primary_color}</span></div></div>
                <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">FAQs</p><p className="font-medium text-foreground">{faqCounts?.[detailBot.id] ?? 0}</p></div>
                <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Conversations</p><p className="font-medium text-foreground">{detailBot.total_conversations ?? 0}</p></div>
              </div>
              <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Welcome Message</p><p className="text-foreground text-xs mt-1">{detailBot.welcome_message || 'None set'}</p></div>
              <div className="rounded-md bg-muted p-3"><p className="text-xs text-muted-foreground">Embed Token</p><p className="font-mono text-xs text-foreground break-all">{detailBot.embed_token ? `${detailBot.embed_token.slice(0, 8)}...` : ''}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chatbot</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete "{deleteConfirm?.name}" and all its FAQs and conversations? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && deleteChatbot.mutate(deleteConfirm.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ChatbotManager;
