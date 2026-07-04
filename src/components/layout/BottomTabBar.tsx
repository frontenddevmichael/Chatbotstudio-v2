import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DashboardIcon, SettingsIcon, AnalyticsIcon, LogOutIcon, PlusIcon } from '@/components/ui/icons';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const tabs = [
  { to: '/dashboard', icon: DashboardIcon, label: 'Home' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  { to: '/builder/new', icon: PlusIcon, label: 'Create', isCenter: true },
  { to: '/billing', icon: AnalyticsIcon, label: 'Billing' },
  { to: '#signout', icon: LogOutIcon, label: 'Sign Out' },
];

const BottomTabBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try { await signOut(); navigate('/'); } catch { toast.error('Failed to sign out'); }
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-around border-t border-border bg-background/80 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)', paddingTop: '6px' }}
    >
      {tabs.map(({ to, icon: Icon, label, isCenter }) => {
        const active = pathname === to || (!isCenter && to !== '/' && pathname.startsWith(to));
        if (isCenter) {
          return (
            <Link key={to} to={to} className="flex flex-col items-center -mt-4">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg"
              >
                <Icon className="h-5 w-5 text-primary-foreground" />
              </motion.div>
              <span className="mt-0.5 text-[10px] font-medium text-primary">{label}</span>
            </Link>
          );
        }
        if (to === '#signout') {
          return (
            <button key={to} onClick={handleSignOut} className="flex flex-col items-center py-1 min-w-[48px]">
              <motion.div whileTap={{ scale: 0.85 }}>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </motion.div>
              <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">{label}</span>
            </button>
          );
        }
        return (
          <Link key={to} to={to} className="flex flex-col items-center py-1 min-w-[48px]">
            <motion.div whileTap={{ scale: 0.85 }}>
              <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
            </motion.div>
            <span className={`mt-0.5 text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
