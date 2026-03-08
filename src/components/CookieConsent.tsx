import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

const COOKIE_KEY = 'cookie_consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-lg"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="rounded-xl border border-border bg-card p-4 shadow-xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium mb-1">We use cookies</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use essential cookies for authentication and functional cookies to improve your experience.{' '}
                  <Link to="/cookies" className="text-primary hover:underline">Learn more</Link>
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={accept}
                    className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={decline}
                    className="h-8 px-4 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Essential Only
                  </button>
                </div>
              </div>
              <button
                onClick={decline}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss cookie consent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
