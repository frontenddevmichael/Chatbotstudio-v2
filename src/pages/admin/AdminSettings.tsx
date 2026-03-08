import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import Spinner from '@/components/ui/Spinner';
import { sanitizeText } from '@/lib/sanitize';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('platform_settings').select('*').single();
      return data;
    },
  });

  const [freeLimit, setFreeLimit] = useState(500);
  const [premiumPrice, setPremiumPrice] = useState(19.99);
  const [maintenance, setMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (settings) {
      setFreeLimit(settings.free_message_limit ?? 500);
      setPremiumPrice(Number(settings.premium_price_monthly) || 19.99);
      setMaintenance(settings.maintenance_mode ?? false);
      setAnnouncement(settings.announcement_text ?? '');
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('platform_settings').update({
        free_message_limit: freeLimit,
        premium_price_monthly: premiumPrice,
        maintenance_mode: maintenance,
        announcement_text: sanitizeText(announcement),
        updated_at: new Date().toISOString(),
      }).eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading) return <AdminLayout><div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <SEO title="Platform Settings" noIndex />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Platform Settings</h1>

      <div className="max-w-md space-y-6">
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Free Message Limit</label>
            <input type="number" value={freeLimit} onChange={(e) => setFreeLimit(Number(e.target.value))} className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Premium Price ($/mo)</label>
            <input type="number" step="0.01" value={premiumPrice} onChange={(e) => setPremiumPrice(Number(e.target.value))} className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} className="rounded border-border" />
            <label className="text-sm text-foreground">Maintenance Mode</label>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Announcement</label>
            <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} rows={3} className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="Platform-wide announcement..." />
          </div>
          <button
            onClick={() => updateSettings.mutate()}
            disabled={updateSettings.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateSettings.isPending ? <Spinner /> : 'Save Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
