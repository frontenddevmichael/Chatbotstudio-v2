import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/adminApi';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import { sanitizeText, isValidUrl } from '@/lib/sanitize';
import { Plus, Trash2, Eye } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

const AdManager = () => {
  const queryClient = useQueryClient();
  const { data: ads, isLoading } = useQuery({
    queryKey: ['admin-ads'],
    queryFn: () => adminFetch('get-ads'),
  });

  const [form, setForm] = useState({ title: '', description: '', cta_text: '', cta_url: '', placement: 'sidebar', is_active: true });
  const [adding, setAdding] = useState(false);

  const createAd = useMutation({
    mutationFn: async () => {
      if (!form.title) throw new Error('Title required');
      if (form.cta_url && !isValidUrl(form.cta_url)) throw new Error('Invalid URL');
      return adminFetch('create-ad', {
        title: sanitizeText(form.title),
        description: sanitizeText(form.description),
        cta_text: sanitizeText(form.cta_text),
        cta_url: form.cta_url,
        placement: form.placement,
        is_active: form.is_active,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      setForm({ title: '', description: '', cta_text: '', cta_url: '', placement: 'sidebar', is_active: true });
      setAdding(false);
      toast.success('Ad created');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteAd = useMutation({
    mutationFn: (id: string) => adminFetch('delete-ad', { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      toast.success('Ad deleted');
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => adminFetch('toggle-ad', { id, is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
    },
  });

  return (
    <AdminLayout>
      <SEO title="Ad Management" noIndex />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Ads</h1>
        <button
          onClick={() => setAdding(!adding)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Ad
        </button>
      </div>

      {adding && (
        <div className="mb-6 space-y-3 rounded-lg border border-border bg-card p-4">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="CTA Text" className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
            <input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} placeholder="CTA URL" className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          </div>
          <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
            <option value="sidebar">Sidebar</option>
            <option value="banner">Banner</option>
          </select>
          <button onClick={() => createAd.mutate()} disabled={createAd.isPending} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {createAd.isPending ? <Spinner /> : 'Create Ad'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded bg-card" />)}</div>
      ) : (
        <div className="space-y-3">
          {ads?.map((ad: any) => (
            <div key={ad.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{ad.title}</p>
                <p className="text-xs text-muted-foreground">{ad.placement} · {ad.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive.mutate({ id: ad.id, is_active: ad.is_active })} className="rounded p-1.5 text-muted-foreground hover:bg-muted">
                  <Eye className="h-4 w-4" />
                </button>
                <button onClick={() => deleteAd.mutate(ad.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdManager;
