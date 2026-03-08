import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Progress } from '@/components/ui/progress';
import {
  LayoutDashboard, Bot, CreditCard, Settings, Shield, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/builder/new', icon: Bot, label: 'New Chatbot' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const { isAdmin, profile, user } = useAuth();
  const [open, setOpen] = useState(false);

  const links = isAdmin
    ? [...navItems, { to: '/admin', icon: Shield, label: 'Admin' }]
    : navItems;

  const initial = (profile?.full_name || user?.email || '?')[0].toUpperCase();
  const usagePercent = profile?.message_limit
    ? Math.min(100, Math.round(((profile.monthly_message_count ?? 0) / profile.message_limit) * 100))
    : 0;

  const nav = (
    <div className="flex h-full flex-col">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-3 py-2">
          <span className="font-display text-lg font-bold text-foreground">
            ChatBot<span className="text-primary"> Studio</span>
          </span>
        </Link>
        {links.map(({ to, icon: Icon, label }) => {
          const active = pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'nav-active-bar bg-primary/5 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {profile?.full_name || user?.email?.split('@')[0]}
            </p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              profile?.plan === 'premium'
                ? 'bg-warning/10 text-warning'
                : 'bg-muted text-muted-foreground'
            }`}>
              {profile?.plan === 'premium' ? 'Premium' : 'Free'}
            </span>
          </div>
        </div>
        <div className="mt-2 px-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Messages</span>
            <span>{profile?.monthly_message_count ?? 0}/{profile?.message_limit ?? 500}</span>
          </div>
          <Progress
            value={usagePercent}
            className="mt-1 h-1 bg-muted"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-3 top-3 z-50 rounded-md bg-card p-2 text-foreground lg:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r border-border bg-background transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {nav}
      </aside>
    </>
  );
};

export default Sidebar;
