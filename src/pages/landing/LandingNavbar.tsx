import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/72 backdrop-blur-xl backdrop-saturate-[1.8] border-b border-border'
          : 'bg-transparent'
      }`}
      initial={{ y: -48 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-[15px] font-semibold tracking-tight text-foreground/90 hover:text-foreground transition-colors"
        >
          ChatBot Studio
        </button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollTo('features')}
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollTo('developers')}
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Developers
          </button>
          <button
            onClick={() => scrollTo('pricing')}
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </button>
          <ThemeToggle />
          <Link to="/login" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link
            to="/signup"
            className="h-8 px-4 inline-flex items-center rounded-[8px] bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile */}
        <button className="md:hidden text-muted-foreground" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden bg-background/90 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              <button onClick={() => scrollTo('features')} className="text-left text-[15px] text-muted-foreground py-2">Features</button>
              <button onClick={() => scrollTo('developers')} className="text-left text-[15px] text-muted-foreground py-2">Developers</button>
              <button onClick={() => scrollTo('pricing')} className="text-left text-[15px] text-muted-foreground py-2">Pricing</button>
              <div className="py-2"><ThemeToggle /></div>
              <Link to="/login" className="text-[15px] text-muted-foreground py-2" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}>
                <span className="mt-2 block h-10 rounded-[8px] bg-primary text-primary-foreground text-[15px] font-medium flex items-center justify-center">
                  Get Started
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default LandingNavbar;
