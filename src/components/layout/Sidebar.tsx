import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const links = isAdmin
    ? [...navItems, { to: '/admin', icon: Shield, label: 'Admin' }]
    : navItems;

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      <Link to="/dashboard" className="mb-6 flex items-center gap-2 px-3 py-2">
        <span className="text-2xl">🤖</span>
        <span className="font-display text-lg font-bold text-foreground">ChatBot Studio</span>
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
