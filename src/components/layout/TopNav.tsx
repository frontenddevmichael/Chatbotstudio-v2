import { useAuth } from '@/context/AuthContext';
import { LogOut, Plus, User, ChevronRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

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

  const firstName = (profile?.full_name || user?.email || '').split(/[\s@]/)[0];
  const initial = (profile?.full_name || user?.email || '?')[0].toUpperCase();

  // Build breadcrumb from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg) => routeLabels[seg] || null).filter(Boolean);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 shadow-[0_1px_0_0_hsl(190_100%_50%/0.06)] md:px-6">
      {/* Left: greeting + breadcrumb */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {getGreeting()}, <span className="font-medium text-foreground">{firstName}</span>
        </span>
        {breadcrumbs.length > 0 && (
          <div className="hidden items-center gap-1 text-xs text-muted-foreground md:flex">
            <ChevronRight className="h-3 w-3" />
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={i === breadcrumbs.length - 1 ? 'text-foreground' : ''}>{crumb}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <Link
          to="/builder/new"
          className="hidden items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground sm:flex"
        >
          <Plus className="h-3 w-3" /> New Chatbot
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initial}
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default TopNav;
