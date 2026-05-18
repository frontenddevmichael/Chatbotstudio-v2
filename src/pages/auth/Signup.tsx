import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const Signup = () => {
  const { user, loading, signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [resending, setResending] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Spinner className="h-6 w-6" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
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
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      toast.success('Verification email resent!');
    } catch {
      toast.error('Failed to resend. Please try again.');
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-[10px] bg-primary px-4 py-2.5 text-[15px] font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
            >
              {submitting ? <Spinner /> : 'Create Account'}
            </button>
          </form>
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
