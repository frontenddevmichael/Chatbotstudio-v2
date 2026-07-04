import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Key, Users, Building2, Cpu, Activity, Plug, MessageSquare, Mail, FlaskConical, Gauge } from 'lucide-react';
import { DashboardIcon, BotIcon, SettingsIcon, LogOutIcon, ShieldIcon } from '@/components/ui/icons';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { useDevice } from '@/hooks/useDevice';
import { motion } from 'framer-motion';


const navItems = [
  { to: '/dashboard', icon: DashboardIcon, label: 'Dashboard' },
  { to: '/builder/new', icon: BotIcon, label: 'New Chatbot' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/dashboard/api-keys', icon: Key, label: 'API Keys' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

const chatbotTools = [
  { to: (id: string) => `/dashboard/model-settings/${id}`, icon: Cpu, label: 'Model Settings', desc: 'Tone & personality' },
  { to: (id: string) => `/dashboard/orchestration/${id}`, icon: Activity, label: 'Orchestration', desc: 'Routing & automation' },
  { to: (id: string) => `/dashboard/integrations/${id}`, icon: Plug, label: 'Integrations', desc: 'Connect 3rd-party apps' },
  { to: (id: string) => `/dashboard/lighthouse/${id}`, icon: Gauge, label: 'Lighthouse', desc: 'Performance audits' },
  { to: (id: string) => `/dashboard/intelligence-studio/${id}`, icon: MessageSquare, label: 'Intelligence', desc: 'Conversation insights' },
  { to: (id: string) => `/dashboard/follow-up-emails/${id}`, icon: Mail, label: 'Follow-Up Emails', desc: 'Automated sequences' },
  { to: (id: string) => `/dashboard/ab-testing/${id}`, icon: FlaskConical, label: 'A/B Testing', desc: 'Compare variants' },
];

const extractChatbotId = (path: string): string | null => {
  const chatbotMatch = path.match(/^\/chatbot\/([^/]+)/);
  if (chatbotMatch) return chatbotMatch[1];
  const builderMatch = path.match(/^\/builder\/([^/]+)/);
  if (builderMatch) return builderMatch[1];
  const dashboardMatch = path.match(/^\/dashboard\/(?:model-settings|orchestration|integrations|lighthouse|intelligence-studio|follow-up-emails|ab-testing)\/([^/]+)/);
  return dashboardMatch ? dashboardMatch[1] : null;
};

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAdmin, profile, user, signOut, agency } = useAuth();
  const [open, setOpen] = useState(false);
  const { isTablet } = useDevice();
  const chatbotId = useMemo(() => extractChatbotId(pathname), [pathname]);

  const handleSignOut = async () => {
    try { await signOut(); navigate('/'); } catch { toast.error('Failed to sign out'); }
  };
  const links = isAdmin
    ? [...navItems, { to: '/admin', icon: ShieldIcon, label: 'Admin' }, { to: '/dashboard/admin/users', icon: Users, label: 'Admin Users' }, { to: '/dashboard/admin/agencies', icon: Building2, label: 'Agencies' }]
    : agency
    ? [...navItems, { to: '/dashboard/agency', icon: Building2, label: 'Agency' }]
    : navItems;

  const initial = (profile?.full_name || user?.email || '?')[0].toUpperCase();
  const usagePercent = profile?.message_limit
    ? Math.min(100, Math.round(((profile.monthly_message_count ?? 0) / profile.message_limit) * 100))
    : 0;

  const sidebarWidth = isTablet ? 'w-[72px]' : 'w-[220px]';

  const nav = (
    <div className="flex h-full flex-col pt-12">
      {/* Section label */}
      {!isTablet && (
        <div className="px-4 mb-2">
          <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground">
            Menu
          </span>
        </div>
      )}

      {/* Nav links */}
      <nav className={`flex-1 flex flex-col gap-0.5 ${isTablet ? 'px-1.5 items-center' : 'px-2'}`}>
        {links.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/builder/new' && pathname.startsWith(to) && to !== '/');
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              title={isTablet ? label : undefined}
              className={`relative flex items-center ${isTablet ? 'justify-center rounded-[8px] p-2.5' : 'gap-2.5 rounded-[6px] px-3 py-[7px]'} text-[14px] font-medium transition-colors ${
                active
                  ? 'bg-[hsl(var(--color-surface-2))] text-foreground'
                  : 'text-muted-foreground hover:bg-[hsl(var(--color-surface-1))] hover:text-foreground'
              }`}
            >
              {active && !isTablet && (
                <motion.span
                  layoutId="sidebarActive"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary"
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              )}
              <Icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />
              {!isTablet && label}
            </Link>
          );
        })}

        {/* Chatbot Tools section — visible when on a chatbot-scoped page */}
        {chatbotId && !isTablet && (
          <>
            <div className="mt-6 px-1">
              <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-muted-foreground">
                Chatbot Tools
              </span>
            </div>
            {chatbotTools.map(({ to, icon: Icon, label, desc }) => {
              const href = to(chatbotId);
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setOpen(false)}
                  className={`relative flex items-center gap-2.5 rounded-[6px] px-3 py-[7px] text-[14px] font-medium transition-colors ${
                    active
                      ? 'bg-[hsl(var(--color-surface-2))] text-foreground'
                      : 'text-muted-foreground hover:bg-[hsl(var(--color-surface-1))] hover:text-foreground'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebarToolsActive"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary"
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    />
                  )}
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px]">{label}</p>
                    <p className="truncate text-[11px] text-muted-foreground/80">{desc}</p>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div className={`flex items-center ${isTablet ? 'justify-center' : 'gap-2.5 px-1 py-1.5'}`}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--color-surface-3))] text-[12px] font-semibold text-foreground">
            {initial}
          </div>
          {!isTablet && (
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
          )}
        </div>
        {!isTablet && (
          <div className="mt-2 px-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Messages</span>
              <span className="font-mono">{profile?.monthly_message_count ?? 0}/{profile?.message_limit ?? 500}</span>
            </div>
            <Progress value={usagePercent} className="mt-1 h-1 bg-muted" />
          </div>
        )}
        <button
          onClick={handleSignOut}
          title={isTablet ? 'Sign out' : undefined}
          className={`mt-2 flex items-center ${isTablet ? 'justify-center rounded-[8px] p-2.5 w-full' : 'gap-2.5 rounded-[6px] px-3 py-[7px] w-full'} text-[14px] font-medium text-muted-foreground transition-colors hover:bg-[hsl(var(--color-surface-1))] hover:text-foreground`}
        >
          <LogOutIcon className="h-4 w-4" />
          {!isTablet && 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 ${sidebarWidth} border-r border-border bg-background transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {nav}
      </aside>
    </>
  );
};

export default Sidebar;
