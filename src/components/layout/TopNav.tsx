import { useAuth } from '@/context/AuthContext';
import { LogOut, Plus, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ui/ThemeToggle';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  builder: 'Builder',
  chatbot: 'Chatbot',
  billing: 'Billing',
  settings: 'Settings',
  admin: 'Admin',
  analytics: 'Analytics',
  faqs: 'FAQs',
  deploy: 'Deploy',
  edit: 'Edit',
  new: 'New',
};

const TopNav = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const initial = (profile?.full_name || user?.email || '?')[0].toUpperCase();
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg) => routeLabels[seg] || null).filter(Boolean);

  const handleSignOut = async () => {
    try { await signOut(); navigate('/login'); } catch { toast.error('Failed to sign out'); }
  };

  return (
    <header
      className="flex h-12 items-center justify-between border-b border-border px-4 md:px-6"
      style={{ background: 'hsl(var(--color-base))' }}
    >
      <div className="flex items-center gap-2">
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
                <span className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>{crumb}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Link
          to="/builder/new"
          className="hidden items-center gap-1.5 rounded-[6px] border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-[hsl(var(--border)/0.18)] sm:flex"
        >
          <Plus className="h-3 w-3" /> New
        </Link>
        <ThemeToggle />
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--color-surface-3))] text-[11px] font-semibold text-foreground">
          {initial}
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-[6px] p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-[hsl(var(--color-surface-1))]"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};

export default TopNav;
