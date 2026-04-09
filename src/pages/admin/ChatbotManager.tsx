import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/adminApi';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Link } from 'react-router-dom';

const ChatbotManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);

  const { data: chatbots, isLoading } = useQuery({
    queryKey: ['admin-chatbots'],
    queryFn: () => adminFetch('get-chatbots'),
  });

  const { data: owners } = useQuery({
    queryKey: ['admin-chatbot-owners'],
    queryFn: () => adminFetch('get-owners'),
  });

  const { data: faqCounts } = useQuery({
    queryKey: ['admin-faq-counts'],
    queryFn: () => adminFetch('get-faq-counts'),
  });

  const filtered = useMemo(() => {
    let result = chatbots ?? [];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((b: any) => b.name?.toLowerCase().includes(q) || owners?.[b.user_id]?.toLowerCase().includes(q));
    }
    if (statusFilter === 'active') result = result.filter((b: any) => b.is_active);
    if (statusFilter === 'inactive') result = result.filter((b: any) => !b.is_active);
    return result;
  }, [chatbots, debouncedSearch, statusFilter, owners]);

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminFetch('toggle-bot-active', { id, is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chatbots'] });
      toast.success('Chatbot updated');
    },
    onError: () => toast.error('Failed to update chatbot'),
  });

  return (
    <AdminLayout>
      <SEO title="Chatbot Management" noIndex />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">All Chatbots</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or owner..."
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-card" />)}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Bot</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">FAQs</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Convos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bot: any) => (
                <tr key={bot.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <span className="mr-2">{bot.avatar_emoji}</span>
                    <span className="text-foreground">{bot.name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{owners?.[bot.user_id] ?? 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      bot.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>{bot.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{faqCounts?.[bot.id] ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{bot.total_conversations ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{bot.created_at ? new Date(bot.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive.mutate({ id: bot.id, is_active: bot.is_active })}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {bot.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <Link to="/admin/conversations" className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline">
                        View Convos
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No chatbots found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default ChatbotManager;
