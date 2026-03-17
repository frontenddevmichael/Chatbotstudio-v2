import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/ui/SEO';
import Spinner from '@/components/ui/Spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const AdminLogin = () => {
  const { user, loading, isAdmin, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    // Only auto-redirect if not in the middle of a login submission
    if (!loading && user && isAdmin && !isSubmittingRef.current) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (user && isAdmin && !isSubmittingRef.current) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    isSubmittingRef.current = true;
    try {
      await signIn(email, password);
      // Wait a tick for auth state to settle
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Authentication failed');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        await signOut();
        toast.error('You do not have admin access');
        return;
      }

      toast.success('Welcome, Admin!');
      navigate('/admin', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Sign in failed');
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <SEO title="Admin Login" description="Admin portal sign in" noIndex />
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <div className="inline-flex items-center gap-2">
            <img src={logo} alt="ChatBot Studio" className="h-7 w-7" />
            <span className="text-[20px] font-semibold text-foreground">
              Admin<span className="text-primary"> Portal</span>
            </span>
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Sign in with your admin credentials
          </p>
        </div>

        <div
          className="rounded-[14px] border border-border bg-card p-6"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[10px] border border-border bg-[hsl(var(--color-surface-3))] px-3 py-2 text-[15px] text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
                Password
              </label>
              <input
                type="password"
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
              {submitting ? <Spinner /> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          This portal is for authorized administrators only.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
