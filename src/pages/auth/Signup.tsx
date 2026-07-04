import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Turnstile } from '@marsidev/react-turnstile';
import logo from '@/assets/logo.png';

const Signup = () => {
  const { user, loading, signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [resending, setResending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Spinner className="h-6 w-6" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) { toast.error('Please fill in all fields'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSubmitting(true);
    try {
      await signUp(email, password, fullName);
      setSignedUp(true);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : null) || 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const emailRedirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo } });
      if (error) throw error;
      toast.success('Verification email resent!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (signedUp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <SEO title="Check Your Email" description="Verify your email to get started." noIndex />
        <div className="w-full max-w-[400px] text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-[22px] font-semibold text-foreground mb-2">Check your email</h1>
          <p className="text-[14px] text-muted-foreground mb-1">
            We sent a verification link to
          </p>
          <p className="text-[15px] font-medium text-foreground mb-6">{email}</p>
          <p className="text-[13px] text-muted-foreground mb-6">
            Click the link in the email to activate your account. If you don't see it, check your spam folder.
          </p>
          <button
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-2 rounded-[10px] border border-border bg-card px-4 py-2.5 text-[14px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {resending ? <Spinner /> : <><RefreshCw className="h-4 w-4" /> Resend verification email</>}
          </button>
          <p className="mt-6 text-[13px] text-muted-foreground">
            Already verified?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SEO title="Get Started" description="Create your free AI chatbot in minutes." />
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
          <p className="mt-2 text-[13px] text-muted-foreground">Create your free account</p>
        </div>

        <div className="rounded-[14px] border border-border bg-card p-6" style={{ boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Full Name</label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Email</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Password</label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                placeholder="Enter your password"
              />
            </div>
            {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onSuccess={setTurnstileToken}
                options={{ size: 'flexible', theme: 'auto' }}
              />
            )}
            <button
              type="submit"
              disabled={submitting || (!!import.meta.env.VITE_TURNSTILE_SITE_KEY && !turnstileToken)}
              className="flex w-full items-center justify-center rounded-[10px] bg-primary px-4 py-2.5 text-[15px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
            >
              {submitting ? <Spinner /> : 'Create Account'}
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

        <p className="mt-4 text-center text-[13px] text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
