import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const FloatingInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const controls = useAnimation();
  const hasBounced = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    if (localStorage.getItem('fab_install_dismissed')) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Auto-expand after 3 seconds, then collapse after 6
  useEffect(() => {
    if (!deferredPrompt || dismissed || isInstalled) return;
    const expandTimer = setTimeout(() => setExpanded(true), 3000);
    const collapseTimer = setTimeout(() => setExpanded(false), 9000);
    return () => {
      clearTimeout(expandTimer);
      clearTimeout(collapseTimer);
    };
  }, [deferredPrompt, dismissed, isInstalled]);

  // Bounce when scrolling past hero
  useEffect(() => {
    if (!deferredPrompt || dismissed || isInstalled) return;
    const onScroll = () => {
      if (hasBounced.current) return;
      if (window.scrollY > window.innerHeight * 0.8) {
        hasBounced.current = true;
        controls.start({
          y: [0, -12, 0, -6, 0],
          transition: { duration: 0.6, ease: 'easeOut' },
        });
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [deferredPrompt, dismissed, isInstalled, controls]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem('fab_install_dismissed', '1');
  };

  if (isInstalled || dismissed || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-[90]"
        style={{ bottom: 'calc(24px + env(safe-area-inset-bottom))' }}
      >
        <motion.button
          onClick={expanded ? handleInstall : () => setExpanded(true)}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          className="relative flex items-center gap-2.5 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
          style={{ padding: expanded ? '12px 20px 12px 16px' : '14px' }}
          layout
          aria-label="Install ChatBot Studio"
        >
          <Download className="h-5 w-5 shrink-0" aria-hidden="true" />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Install App
              </motion.span>
            )}
          </AnimatePresence>

          {/* Dismiss X */}
          <button
            onClick={handleDismiss}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.button>

        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          style={{ pointerEvents: 'none' }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingInstallButton;
