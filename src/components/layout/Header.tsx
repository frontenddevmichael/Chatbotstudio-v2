import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { LogOutIcon, PlusIcon, ChevronRightIcon, SettingsIcon } from '@/components/ui/icons';
import { toast } from 'sonner';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import logo from '@/assets/logo.png';

interface Props {
  intensity: 'expressive' | 'quiet';
}

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

const Header = ({ intensity }: Props) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isExpressive = intensity === 'expressive';

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSignOut = async () => {
    try { await signOut(); navigate('/'); } catch { toast.error('Failed to sign out'); }
  };

  const initial = (profile?.full_name || user?.email || '?')[0].toUpperCase();
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg) => routeLabels[seg] || null).filter(Boolean);

  return (
    <motion.header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/72 backdrop-blur-xl backdrop-saturate-[1.8] border-b border-border/10'
          : 'bg-transparent'
      }`}
      initial={{ y: -48 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`flex items-center justify-between ${isExpressive ? 'max-w-6xl h-14 px-6 mx-auto' : 'h-12 px-6 pr-12'}`}>
        {/* Logo */}
        {isExpressive ? (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <img src={logo} alt="ChatBot Studio" className="h-7 w-7" />
            <span className="font-display text-[17px] font-medium tracking-tight text-ink">ChatBot Studio</span>
          </button>
        ) : (
          <Link
            to="/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={logo} alt="ChatBot Studio" className="h-6 w-6" />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              ChatBot<span className="text-primary"> Studio</span>
            </span>
          </Link>
        )}

        {/* Expressive nav — desktop */}
        {isExpressive && (
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-[13px] text-ink-muted hover:text-ink transition-colors">
              Features
            </button>
            <button onClick={() => scrollTo('developers')} className="text-[13px] text-ink-muted hover:text-ink transition-colors">
              Developers
            </button>
            <button onClick={() => scrollTo('pricing')} className="text-[13px] text-ink-muted hover:text-ink transition-colors">
              Pricing
            </button>
            <ThemeToggle />
            <Link to="/login" className="text-[13px] text-ink-muted hover:text-ink transition-colors">
              Sign In
            </Link>
            <Link
              to="/signup"
              className="h-9 px-5 inline-flex items-center rounded-pill bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}

        {/* Quiet nav — desktop */}
        {!isExpressive && (
          <div className="hidden md:flex items-center gap-2">
            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1 text-[12px] text-muted-foreground mr-4">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRightIcon className="h-3 w-3 text-muted-foreground/40" />}
                    <span className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>{crumb}</span>
                  </span>
                ))}
              </div>
            )}
            <Link
              to="/builder/new"
              className="items-center gap-1.5 rounded-[6px] border border-border px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-[hsl(var(--border)/0.18)] hidden sm:flex"
            >
              <PlusIcon className="h-3 w-3" /> New
            </Link>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold text-foreground hover:opacity-80 transition-opacity">
                  {initial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-[13px] font-medium text-foreground">{profile?.full_name || user?.email?.split('@')[0]}</p>
                    <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                    <span className={`mt-0.5 self-start rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      profile?.plan === 'premium' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'
                    }`}>
                      {profile?.plan === 'premium' ? 'Premium' : 'Free'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/settings')} className="flex items-center gap-2 cursor-pointer">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut} className="flex items-center gap-2 cursor-pointer">
                  <LogOutIcon className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-2"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        )}

        {/* Mobile toggle */}
        {isExpressive && (
          <button className="md:hidden text-ink-muted" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation menu" aria-expanded={menuOpen}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      {/* Mobile menu — expressive only */}
      {isExpressive && (
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden bg-background/90 backdrop-blur-xl border-b border-border/10 overflow-hidden"
            >
              <div className="flex flex-col gap-1 px-6 py-4">
                <button onClick={() => scrollTo('features')} className="text-left text-[15px] text-ink-muted py-2">Features</button>
                <button onClick={() => scrollTo('developers')} className="text-left text-[15px] text-ink-muted py-2">Developers</button>
                <button onClick={() => scrollTo('pricing')} className="text-left text-[15px] text-ink-muted py-2">Pricing</button>
                <div className="py-2"><ThemeToggle /></div>
                <Link to="/login" className="text-[15px] text-ink-muted py-2" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)}>
                  <span className="mt-2 block h-10 rounded-pill bg-primary text-primary-foreground text-[15px] font-medium flex items-center justify-center">
                    Get Started
                  </span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.header>
  );
};

export default Header;
