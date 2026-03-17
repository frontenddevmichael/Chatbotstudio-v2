import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash (multiple formats)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const type = params.get('type');
    const accessToken = params.get('access_token');

    if (type === 'recovery' && accessToken) {
      setReady(true);
      return;
    }

    // Listen for auth state change with recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Fallback: if hash exists but in a different format, give it time
    if (hash.length > 1) {
      setTimeout(() => setReady(true), 1500);
    } else {
      // No hash at all — still show the form after a brief wait
      setTimeout(() => setReady(true), 500);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SEO title="Set New Password" description="Set your new ChatBot Studio password" noIndex />
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <h1 className="text-[22px] font-semibold text-foreground">
            ChatBot<span className="text-primary"> Studio</span>
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">Set your new password</p>
        </div>

        <div className="rounded-[14px] border border-border bg-card p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          {!ready ? (
            <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center rounded-[10px] bg-primary px-4 py-2.5 text-[15px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
              >
                {submitting ? <Spinner /> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
