import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, initialAuthHash } from '@/integrations/supabase/client';
import Spinner from '@/components/ui/Spinner';
import SEO from '@/components/ui/SEO';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash || initialAuthHash || '';
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const type = params.get('type');
    const errorDesc = params.get('error_description') || params.get('error');

    if (errorDesc) {
      // URLSearchParams already decodes URI components, so decodeURIComponent would be
      // redundant here. Supabase sends error_description=%7B%7D (URL-encoded `{}`) as a
      // placeholder for unknown errors — treat that as a generic failure message.
      const decoded = errorDesc === '{}' ? 'Something went wrong' : errorDesc;
      toast.error(decoded);
      navigate('/login', { replace: true });
      return;
    }

    if (type === 'recovery') {
      navigate(`/reset-password${hash}`, { replace: true });
      return;
    }

    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      if (ok) {
        toast.success('Email verified — welcome!');
        navigate('/dashboard', { replace: true });
      } else {
        toast.error('Could not complete verification. Please sign in.');
        navigate('/login', { replace: true });
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !done) finish(true);
    }).catch((err) => {
      console.error('getSession failed:', err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (session) {
          navigate('/reset-password', { replace: true });
        }
        return;
      }
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        finish(true);
      }
    });

    const timeout = setTimeout(() => finish(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SEO title="Verifying…" description="Completing your sign-in" noIndex />
      <div className="text-center">
        <Spinner className="h-6 w-6 mx-auto mb-3" />
        <p className="text-[14px] text-muted-foreground">Verifying your email…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
