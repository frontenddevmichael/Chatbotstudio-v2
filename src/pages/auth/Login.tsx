import { useLayoutEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Turnstile } from '@marsidev/react-turnstile';
import logo from '@/assets/logo.png';

const INVALID_CREDS = /invalid login credentials|invalid password|user not found/i;

const checkIfAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin');
    return !!data && data.length > 0;
  } catch {
    return false;
  }
};

const Login = () => {
  const { user, isAdmin, loading, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [resending, setResending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  useLayoutEffect(() => {
    if (user && !loading) navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
  }, [user, isAdmin, loading, navigate]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Spinner className="h-6 w-6" /></div>;

  const handleResendVerify = async () => {
    if (!email) { toast.error('Enter your email above first'); return; }
    setResending(true);
    try {
      const emailRedirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } });
      if (error) throw error;
      toast.success('Verification email sent — check your inbox.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not resend verification email');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setSubmitting(true);
    setNeedsVerify(false);
    setShowMigration(false);
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      const { data: { user } } = await supabase.auth.getUser();
      const isAdminUser = user ? await checkIfAdmin(user.id) : false;
      navigate(isAdminUser ? '/admin' : '/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      if (/not confirmed|not verified|email.*confirm/i.test(msg)) {
        setNeedsVerify(true);
        toast.error('Please verify your email first.');
      } else {
        setShowMigration(INVALID_CREDS.test(msg));
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SEO title="Sign In" description="Sign in to ChatBot Studio" noIndex />
      <div className="w-full max-w-[380px]">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="ChatBot Studio" className="h-8 w-8" />
            <span className="text-[22px] font-semibold text-foreground">ChatBot<span className="text-primary"> Studio</span></span>
          </Link>
          <p className="mt-2 text-[13px] text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="rounded-[14px] border border-border bg-card p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                placeholder="Enter your password"
              />
              <Link to="/forgot-password" className="mt-1 block text-right text-[12px] text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
              <div className="overflow-hidden rounded-[10px]">
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={setTurnstileToken}
                  options={{ size: 'flexible', theme: 'auto' }}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || (!!import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken)}
              className="flex w-full items-center justify-center rounded-[10px] bg-primary px-4 py-2.5 text-[15px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
            >
              {submitting ? <Spinner /> : 'Sign In'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative flex justify-center text-[11px] uppercase tracking-wider text-muted-foreground">
              <span className="bg-card px-2">or continue with</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-border bg-background px-4 py-2.5 text-[14px] font-medium text-foreground transition-all hover:bg-muted active:scale-[0.97]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
        </div>

        {/* Migration banner */}
        {showMigration && (
          <div className="mt-4 rounded-[12px] border border-warning/20 bg-warning/5 p-4 text-center relative">
            <button
              onClick={() => setShowMigration(false)}
              className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-[13px] text-foreground pr-6">
              We recently upgraded our database.{' '}
              <Link
                to={`/forgot-password?email=${encodeURIComponent(email)}`}
                className="font-medium text-primary hover:underline"
              >
                Reset your password
              </Link>{' '}
              to regain access.
            </p>
          </div>
        )}

        {needsVerify && (
          <div className="mt-4 rounded-[12px] border border-border bg-card p-4 text-center">
            <p className="text-[13px] text-muted-foreground mb-3">
              Your email isn't verified yet. We can resend the verification link to <span className="font-medium text-foreground">{email}</span>.
            </p>
            <button
              type="button"
              onClick={handleResendVerify}
              disabled={resending}
              className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {resending ? <Spinner /> : <><RefreshCw className="h-4 w-4" /> Resend verification email</>}
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-[13px] text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">Get started</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
