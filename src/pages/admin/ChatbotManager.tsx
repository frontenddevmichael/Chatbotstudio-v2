import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const ChatbotManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);

  const { data: chatbots, isLoading } = useQuery({
    queryKey: ['admin-chatbots'],
    queryFn: async () => {
      const { data } = await supabase.from('chatbots').select('*').order('created_at', { ascending: false }).limit(500);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    let result = chatbots ?? [];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((b: any) => b.name?.toLowerCase().includes(q));
    }
    if (statusFilter === 'active') result = result.filter((b: any) => b.is_active);
    if (statusFilter === 'inactive') result = result.filter((b: any) => !b.is_active);
    return result;
  }, [chatbots, debouncedSearch, statusFilter]);

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('chatbots').update({ is_active: !is_active }).eq('id', id);
      if (error) throw error;
    },
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
            placeholder="Search by name..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Conversations</th>
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
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      bot.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>{bot.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{bot.total_conversations ?? 0}</td>
                  <td className="px-4 py-3 text-muted-foreground">{bot.created_at ? new Date(bot.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive.mutate({ id: bot.id, is_active: bot.is_active })}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {bot.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No chatbots found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default ChatbotManager;
