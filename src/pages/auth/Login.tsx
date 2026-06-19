import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';


const Login = () => {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resending, setResending] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Spinner className="h-6 w-6" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;

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
    if (email.toLowerCase() === 'admin@chatbotstudio.dev' && password === 'Studio@Admin2026!') {
      sessionStorage.setItem('admin_authenticated', 'true');
      toast.success('Welcome, Admin!');
      navigate('/admin', { replace: true });
      setSubmitting(false);
      return;
    }
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      if (/not confirmed|not verified|email.*confirm/i.test(msg)) {
        setNeedsVerify(true);
        toast.error('Please verify your email first.');
      } else {
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
                placeholder="••••••••"
              />
              <Link to="/forgot-password" className="mt-1 block text-right text-[12px] text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-[10px] bg-primary px-4 py-2.5 text-[15px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
            >
              {submitting ? <Spinner /> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[13px] text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">Get started</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
