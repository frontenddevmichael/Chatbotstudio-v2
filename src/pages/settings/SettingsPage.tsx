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

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const initial = (profile?.full_name || user?.email || '?')[0].toUpperCase();
  const usagePercent = profile?.message_limit
    ? Math.min(100, Math.round(((profile.monthly_message_count ?? 0) / profile.message_limit) * 100))
    : 0;

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

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) { toast.error('Please fill in both password fields'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : null) || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <PageWrapper>
      <SEO title="Settings" noIndex />
      <div className="max-w-[480px]">
        <h1 className="text-[22px] font-semibold text-foreground mb-8">Settings</h1>

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--color-surface-3))] text-xl font-semibold text-foreground">
            {initial}
          </div>
          <div>
            <p className="text-[15px] font-medium text-foreground">{profile?.full_name || 'Unnamed'}</p>
            <p className="text-[13px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Profile form */}
        <div className="rounded-[14px] border border-border bg-card p-5 mb-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Email</label>
              <input
                readOnly
                value={user?.email || ''}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[14px] text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[14px] text-foreground outline-none transition-colors focus:border-primary"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 transition-all"
            >
              {saving ? <Spinner /> : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Password change */}
        <div className="rounded-[14px] border border-border bg-card p-5 mb-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[14px] text-foreground outline-none transition-colors focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[14px] text-foreground outline-none transition-colors focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={changingPassword}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 transition-all"
            >
              {changingPassword ? <Spinner /> : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Plan */}
        <div className="rounded-[14px] border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground mb-4">Plan</h3>
          <p className="text-[17px] font-semibold capitalize text-foreground">{profile?.plan || 'Free'}</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Monthly Messages</span>
              <span className="font-mono text-muted-foreground">
                {profile?.monthly_message_count ?? 0} / {profile?.message_limit ?? 500}
              </span>
            </div>
            <Progress value={usagePercent} className="mt-2 h-1 bg-muted" />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default SettingsPage;
