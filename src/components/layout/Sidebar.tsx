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
      {/* Logo */}
      <div className="px-4 py-5">
        <Link to="/dashboard" className="text-[15px] font-semibold text-foreground" onClick={() => setOpen(false)}>
          ChatBot<span className="text-primary"> Studio</span>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-4 mb-2">
        <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground">
          Menu
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {links.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/builder/new' && pathname.startsWith(to) && to !== '/');
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-[6px] px-3 py-[7px] text-[14px] font-medium transition-colors ${
                active
                  ? 'bg-[hsl(var(--color-surface-2))] text-foreground'
                  : 'text-muted-foreground hover:bg-[hsl(var(--color-surface-1))] hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-surface-3))] text-[12px] font-semibold text-foreground">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">
              {profile?.full_name || user?.email?.split('@')[0]}
            </p>
            <span className={`text-[10px] font-medium ${
              profile?.plan === 'premium' ? 'text-warning' : 'text-muted-foreground'
            }`}>
              {profile?.plan === 'premium' ? 'Premium' : 'Free'}
            </span>
          </div>
        </div>
        <div className="mt-2 px-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Messages</span>
            <span className="font-mono">{profile?.monthly_message_count ?? 0}/{profile?.message_limit ?? 500}</span>
          </div>
          <Progress value={usagePercent} className="mt-1 h-1 bg-muted" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-3 top-3 z-50 rounded-[6px] p-2 text-foreground lg:hidden"
        style={{ background: 'hsl(var(--color-surface-2))' }}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[220px] border-r border-border bg-background transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {nav}
      </aside>
    </>
  );
};

export default Sidebar;
