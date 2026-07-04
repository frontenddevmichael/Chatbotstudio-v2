import { ReactNode, useState } from 'react';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Megaphone, Menu, Mail, ChevronRight, Building2 } from 'lucide-react';
import { DashboardIcon, BotIcon, ChatIcon, SettingsIcon, LogOutIcon, ShieldIcon } from '@/components/ui/icons';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import PageLoader from '@/components/ui/PageLoader';

const adminNav = [
  { to: '/admin', icon: DashboardIcon, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/chatbots', icon: BotIcon, label: 'Chatbots' },
  { to: '/admin/conversations', icon: ChatIcon, label: 'Conversations' },
  { to: '/admin/waitlist', icon: Mail, label: 'Waitlist' },
  { to: '/admin/ads', icon: Megaphone, label: 'Ads' },
  { to: '/admin/settings', icon: SettingsIcon, label: 'Settings' },
  { to: '/dashboard/admin/agencies', icon: Building2, label: 'Agencies' },
];

const labelMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users',
  '/admin/chatbots': 'Chatbots',
  '/admin/conversations': 'Conversations',
  '/admin/waitlist': 'Waitlist',
  '/admin/ads': 'Ads',
  '/admin/settings': 'Settings',
};

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, loading, signOut } = useAuth();

  if (loading) return <PageLoader />;

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const currentLabel = labelMap[pathname] || 'Admin';

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <ShieldIcon className="h-5 w-5 text-primary" />
        <span className="text-lg font-bold text-foreground">Admin Portal</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {adminNav.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/admin' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center justify-between px-3">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOutIcon className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border md:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-card shadow-lg">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
            {pathname !== '/admin' && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-foreground">{currentLabel}</span>
              </>
            )}
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
