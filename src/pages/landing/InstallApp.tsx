import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Download, Wifi, Bell, Smartphone, Monitor } from 'lucide-react';
import { SuperchargeIcon } from '@/components/ui/icons';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const BENEFITS = [
  { icon: Wifi, title: 'Offline Access', desc: 'Manage your bots even without an internet connection.' },
  { icon: SuperchargeIcon, title: 'Instant Launch', desc: 'Open from your home screen — no browser needed.' },
  { icon: Bell, title: 'Push Notifications', desc: 'Get alerted when conversations need attention.' },
];

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.15 });

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <section id="install" ref={ref} className="relative py-28 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/60 mb-3">
            Install the App
          </span>
          <h2 className="font-display text-[clamp(28px,4vw,44px)] italic leading-[1.1] text-ink">
            Your pocket command center
          </h2>
          <p className="mt-4 text-[15px] text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Install ChatBot Studio as a native app on any device. Works on desktop & mobile.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-5 mb-14"
        >
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
              className="rounded-[14px] border border-border bg-card/50 p-5 text-center"
            >
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-[10px] bg-muted/50 mb-3">
                <b.icon className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
              <p className="text-[14px] font-medium text-foreground/80">{b.title}</p>
              <p className="mt-1 text-[12px] text-muted-foreground/70 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Install CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          {isInstalled ? (
            <div className="inline-flex items-center gap-2 rounded-[10px] bg-muted/50 border border-border px-6 py-3 text-[13px] text-muted-foreground">
              <Download className="h-4 w-4" />
              Already installed — you're all set!
            </div>
          ) : deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="inline-flex items-center gap-2.5 rounded-[10px] bg-primary hover:bg-primary/90 px-7 py-3 text-[14px] font-medium text-primary-foreground transition-colors"
            >
              <Download className="h-4 w-4" />
              Install ChatBot Studio
            </button>
          ) : (
            <div className="max-w-md mx-auto">
              {isIOS || isSafari ? (
                <div className="rounded-[14px] border border-border bg-card/50 p-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[13px] font-medium text-foreground/70">
                      {isIOS ? 'iOS' : 'Safari'} Install
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    Tap the <span className="text-foreground/60 font-medium">Share</span> button in your browser,
                    then select <span className="text-foreground/60 font-medium">"Add to Home Screen"</span> to install.
                  </p>
                </div>
              ) : (
                <div className="rounded-[14px] border border-border bg-card/50 p-5">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[13px] font-medium text-foreground/70">Install as App</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    Look for the install icon in your browser's address bar, or use the browser menu → <span className="text-foreground/60 font-medium">"Install App"</span>.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default InstallApp;
