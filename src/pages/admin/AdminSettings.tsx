import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/adminApi';
import AdminLayout from '@/components/layout/AdminLayout';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import Spinner from '@/components/ui/Spinner';
import { sanitizeText } from '@/lib/sanitize';
import type { AdminPlatformSettings } from '@/types/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ['platform-settings'], queryFn: () => adminFetch<AdminPlatformSettings>('get-settings') });

  const [freeLimit, setFreeLimit] = useState(500);
  const [premiumPrice, setPremiumPrice] = useState(19.99);
  const [maintenance, setMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [purgeDays, setPurgeDays] = useState(90);
  const [dangerConfirm, setDangerConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFreeLimit(settings.free_message_limit ?? 500);
      setPremiumPrice(Number(settings.premium_price_monthly) || 19.99);
      setMaintenance(settings.maintenance_mode ?? false);
      setAnnouncement(settings.announcement_text ?? '');
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: () => adminFetch('update-settings', {
      free_message_limit: freeLimit, premium_price_monthly: premiumPrice,
      maintenance_mode: maintenance, announcement_text: sanitizeText(announcement),
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['platform-settings'] }); toast.success('Settings saved'); },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to save settings'),
  });

  const resetAllMessages = useMutation({
    mutationFn: () => adminFetch('reset-all-messages'),
    onSuccess: () => { toast.success('All message counts reset'); setDangerConfirm(null); },
    onError: (err) => { toast.error(err instanceof Error ? err.message : 'Failed to reset messages'); setDangerConfirm(null); },
  });

  const purgeConversations = useMutation({
    mutationFn: () => adminFetch('purge-old-conversations', { olderThanDays: purgeDays }),
    onSuccess: () => { toast.success(`Conversations older than ${purgeDays} days purged`); setDangerConfirm(null); },
    onError: (err) => { toast.error(err instanceof Error ? err.message : 'Failed to purge conversations'); setDangerConfirm(null); },
  });

  if (isLoading) return (
    <AdminLayout>
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
      <div className="max-w-lg">
        <div className="mb-4 flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-md bg-[hsl(var(--color-surface-2))]" />
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3.5 w-32 animate-pulse rounded bg-[hsl(var(--color-surface-2))]" />
              <div className="h-9 w-full animate-pulse rounded-md bg-[hsl(var(--color-surface-2))]" />
            </div>
          ))}
          <div className="h-9 w-28 animate-pulse rounded-md bg-[hsl(var(--color-surface-2))]" />
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <SEO title="Platform Settings" noIndex />
      <h1 className="mb-6 text-2xl font-bold text-foreground">Platform Settings</h1>

      <Tabs defaultValue="general" className="max-w-lg">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="limits">Limits & Pricing</TabsTrigger>
          <TabsTrigger value="danger" className="text-destructive data-[state=active]:text-destructive">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} className="rounded border-border" />
              <label className="text-sm text-foreground">Maintenance Mode</label>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Announcement</label>
              <textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} rows={3} className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" placeholder="Platform-wide announcement..." />
            </div>
            <button onClick={() => updateSettings.mutate()} disabled={updateSettings.isPending} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {updateSettings.isPending ? <Spinner /> : 'Save Settings'}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="limits">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Free Message Limit</label>
              <input type="number" value={freeLimit} onChange={(e) => setFreeLimit(Number(e.target.value))} className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Premium Price ($/mo)</label>
              <input type="number" step="0.01" value={premiumPrice} onChange={(e) => setPremiumPrice(Number(e.target.value))} className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
            <button onClick={() => updateSettings.mutate()} disabled={updateSettings.isPending} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {updateSettings.isPending ? <Spinner /> : 'Save Settings'}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="danger">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">Danger Zone</span>
            </div>

            <div className="rounded-md border border-border bg-card p-3 space-y-2">
              <p className="text-sm font-medium text-foreground">Reset all message counts</p>
              <p className="text-xs text-muted-foreground">Sets monthly_message_count to 0 for all users.</p>
              <button onClick={() => setDangerConfirm('reset-messages')} className="rounded border border-destructive bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20">Reset All</button>
            </div>

            <div className="rounded-md border border-border bg-card p-3 space-y-2">
              <p className="text-sm font-medium text-foreground">Purge old conversations</p>
              <p className="text-xs text-muted-foreground">Delete conversations older than specified days.</p>
              <div className="flex items-center gap-2">
                <input type="number" value={purgeDays} onChange={(e) => setPurgeDays(Number(e.target.value))} className="w-20 rounded-md border border-border bg-muted px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                <span className="text-xs text-muted-foreground">days</span>
                <button onClick={() => setDangerConfirm('purge-convos')} className="rounded border border-destructive bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20">Purge</button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!dangerConfirm} onOpenChange={(open) => !open && setDangerConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Destructive Action</AlertDialogTitle>
            <AlertDialogDescription>
              {dangerConfirm === 'reset-messages' ? 'This will reset message counts for ALL users to 0. Continue?' : `This will permanently delete all conversations older than ${purgeDays} days. Continue?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (dangerConfirm === 'reset-messages') resetAllMessages.mutate(); else purgeConversations.mutate(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSettings;
