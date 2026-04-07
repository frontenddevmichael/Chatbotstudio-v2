import { ReactNode, useState } from 'react';
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bot,
  MessageSquare,
  Megaphone,
  Settings,
  Shield,
  Menu,
  LogOut,
} from 'lucide-react';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/chatbots', icon: Bot, label: 'Chatbots' },
  { to: '/admin/conversations', icon: MessageSquare, label: 'Conversations' },
  { to: '/admin/ads', icon: Megaphone, label: 'Ads' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (sessionStorage.getItem('admin_authenticated') !== 'true') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    navigate('/admin/login', { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-display text-lg font-bold text-foreground">Admin Portal</span>
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
      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
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
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-bold text-foreground">Admin Portal</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
