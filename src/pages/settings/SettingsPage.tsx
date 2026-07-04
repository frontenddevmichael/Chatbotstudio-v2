import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import PageWrapper from '@/components/layout/PageWrapper';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, TrashIcon } from 'lucide-react';

const SettingsPage = () => {
  const { profile, refreshProfile, user, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Timezone
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  });

  // Avatar file upload
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial = (profile?.full_name || user?.email || '?')[0].toUpperCase();
  const usagePercent = profile?.message_limit
    ? Math.min(100, Math.round(((profile.monthly_message_count ?? 0) / profile.message_limit) * 100))
    : 0;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `avatars/${user?.id}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);
      if (updateError) throw updateError;

      await refreshProfile();
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar');
      setAvatarPreview(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      // Attempt to call an edge function for account deletion
      // Falls back gracefully if not deployed
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) throw error;
      toast.success('Account deleted');
      await signOut();
    } catch {
      toast.error('Account deletion requires server setup. Please contact support.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <PageWrapper>
      <SEO title="Settings" noIndex />
      <div className="max-w-[480px]">
        <h1 className="text-[22px] font-semibold text-foreground mb-8">Settings</h1>

        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleAvatarClick}
            className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-surface-3))] text-xl font-semibold text-foreground overflow-hidden transition-opacity hover:opacity-90"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
              Edit
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarFile}
          />
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
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[14px] text-foreground outline-none transition-colors focus:border-primary"
              >
                {Intl.supportedValuesOf?.('timeZone')?.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                )) ?? (
                  <option value={timezone}>{timezone}</option>
                )}
              </select>
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
        <div className="rounded-[14px] border border-border bg-card p-5 mb-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
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

        {/* Danger Zone */}
        {!showDeleteConfirm ? (
          <div className="rounded-[14px] border border-destructive/20 bg-destructive/[0.02] p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-destructive">Danger Zone</h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-[8px] border border-destructive/30 px-3 py-1.5 text-[12px] font-medium text-destructive hover:bg-destructive/5 transition-colors"
              >
                <TrashIcon className="h-3.5 w-3.5" /> Delete Account
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[14px] border border-destructive/30 bg-destructive/[0.03] p-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="text-[13px] font-semibold text-destructive">Are you absolutely sure?</h3>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">
              This will permanently delete your account, chatbots, conversations, and all associated data. This action cannot be undone.
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[12px] text-muted-foreground">
                  Type <span className="font-mono font-medium text-destructive">DELETE</span> to confirm
                </label>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-[8px] border border-destructive/30 bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[14px] text-foreground outline-none transition-colors focus:border-destructive"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                  disabled={deleting}
                  className="rounded-[8px] border border-border px-4 py-2 text-[12px] font-medium text-foreground hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex items-center gap-1.5 rounded-[8px] bg-destructive px-4 py-2 text-[12px] font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40 transition-all"
                >
                  {deleting ? <Spinner /> : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default SettingsPage;
