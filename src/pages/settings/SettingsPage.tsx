import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { profile, refreshProfile, user } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  const initial = (profile?.full_name || user?.email || '?')[0].toUpperCase();
  const usagePercent = profile?.message_limit
    ? Math.min(100, Math.round(((profile.monthly_message_count ?? 0) / profile.message_limit) * 100))
    : 0;
  const usageColor = usagePercent > 90 ? 'text-destructive' : usagePercent > 60 ? 'text-warning' : 'text-success';

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <SEO title="Settings" noIndex />
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Settings</h1>

      <div className="max-w-md space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {initial}
          </div>
          <div>
            <p className="font-display text-lg font-bold text-foreground">{profile?.full_name || 'Unnamed'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Profile */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
              <input
                readOnly
                value={user?.email || ''}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Spinner /> : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Plan */}
        <div className="glass-card rounded-lg p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</h3>
          <p className="font-display text-lg font-bold capitalize text-foreground">{profile?.plan || 'Free'}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Monthly Messages</span>
              <span className={`font-mono font-medium ${usageColor}`}>
                {profile?.monthly_message_count ?? 0} / {profile?.message_limit ?? 500}
              </span>
            </div>
            <Progress value={usagePercent} className="mt-2 h-1.5 bg-muted" />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default SettingsPage;
