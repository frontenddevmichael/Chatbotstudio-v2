import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/adminApi';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import { Search, Download, Trash2, Mail } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDistanceToNow } from 'date-fns';

const WaitlistManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['admin-waitlist'],
    queryFn: () => adminFetch<any[]>('get-waitlist'),
  });

  const filtered = useMemo(() => {
    if (!debouncedSearch) return entries ?? [];
    const q = debouncedSearch.toLowerCase();
    return (entries ?? []).filter((e: any) => e.email?.toLowerCase().includes(q));
  }, [entries, debouncedSearch]);

  const deleteEntry = useMutation({
    mutationFn: (id: string) => adminFetch('delete-waitlist-entry', { id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] }); toast.success('Entry removed'); },
    onError: () => toast.error('Failed to remove'),
  });

  const exportCSV = () => {
    const rows = filtered.map((e: any) => ({ Email: e.email, Joined: e.created_at ? new Date(e.created_at).toLocaleDateString() : '' }));
    const header = 'Email,Joined';
    const csv = [header, ...rows.map((r: any) => `${r.Email},${r.Joined}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'waitlist-export.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <AdminLayout>
      <SEO title="Waitlist Management" noIndex />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Waitlist ({filtered.length})</h1>
        <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email..." className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-card" />)}</div>
      ) : !filtered.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Mail className="mb-3 h-10 w-10" />
          <p className="text-sm">No waitlist entries</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry: any) => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{entry.email}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {entry.created_at ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true }) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteEntry.mutate(entry.id)} className="text-xs text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default WaitlistManager;
