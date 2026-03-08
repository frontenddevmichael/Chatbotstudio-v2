import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import BottomTabBar from './BottomTabBar';
import Spinner from '@/components/ui/Spinner';
import CommandPalette from '@/components/CommandPalette';
import { useDevice } from '@/hooks/useDevice';

const PageWrapper = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { isMobile } = useDevice();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <Sidebar />}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNav />
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
