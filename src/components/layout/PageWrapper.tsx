import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomTabBar from './BottomTabBar';
import Spinner from '@/components/ui/Spinner';
import CommandPalette from '@/components/CommandPalette';
import { useDevice } from '@/hooks/useDevice';
import { RefreshCw } from 'lucide-react';

const PageWrapper = ({ children }: { children: ReactNode }) => {
  const { user, profile, loading, restoring, restoreError, retryRestore } = useAuth();
  const { isMobile } = useDevice();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      const timer = setTimeout(() => setShouldRedirect(true), 150);
      return () => clearTimeout(timer);
    }
    setShouldRedirect(false);
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user && shouldRedirect) return <Navigate to="/login" replace />;
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!profile) {
    if (restoring) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="text-center max-w-sm space-y-2">
            <p className="text-[15px] font-medium text-foreground">
              Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}!
            </p>
            <p className="text-[13px] text-muted-foreground">
              We're restoring your account after our recent database upgrade. This will only take a moment.
            </p>
          </div>
        </div>
      );
    }

    if (restoreError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-4">
          <div className="max-w-sm text-center space-y-3">
            <p className="text-sm text-muted-foreground">We couldn't restore your account automatically.</p>
            <p className="text-xs text-destructive">{restoreError}</p>
            <button
              onClick={retryRestore}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header intensity="quiet" />
      <div className="flex flex-1 min-h-0">
        {!isMobile && <Sidebar />}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6" role="main" style={{ paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : undefined }}>
          {children}
        </main>
      </div>
      {isMobile && <BottomTabBar />}
      <CommandPalette />
    </div>
  );
};

export default PageWrapper;
